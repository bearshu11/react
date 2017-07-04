var dispatcher = new Flux.Dispatcher();

var GetJsonAction = {
    sendGetRequest: function(url, query, viewCallBack, actionCallback) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
            request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            request.onreadystatechange = function(){
                if (request.readyState === 4 && request.status === 200){
                    var returnedJson = JSON.parse(request.responseText);
                    actionCallback(returnedJson);
                }
                else if (request.readyState === 4 && request.status !== 200){
                    alert('error');
                }
            };
            request.send();
    },

    getJson: function (url, query, viewCallback) {
        this.sendGetRequest(url, query, viewCallback, function(returnedJson){
            var json = returnedJson;
            dispatcher.dispatch({
                actionType: "getJson",
                data: json
            });
            viewCallback();
        });
    }
};
var GetWatchingAction = {
    getWatching: function() {
        var request = new XMLHttpRequest();
        var url = "https://api.github.com/user/subscriptions";
        var token = '';
        request.open('GET', url, true);
            request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            request.setRequestHeader('Authorization',token);
            request.onreadystatechange = function(){
                if (request.readyState === 4 && request.status === 200){
                    var returnedJson = JSON.parse(request.responseText);
                    dispatcher.dispatch({
                        actionType: "getWatching",
                        data: returnedJson
                    });
                }
                else if (request.readyState === 4 && request.status !== 200){
                    alert('error');
                }
            };
            request.send();
    },
}

var RegisterJsonAction = {
    registerJson: function(json) {
        dispatcher.dispatch({
            actionType: "registerJson",
            data: json
        });
    }
};

var RemoveJsonAction = {
    romoveJson: function(json) {
        dispatcher.dispatch({
            actionType: "removeJson",
            data: json
        });
    }
};

var _responce = {data:null};
var _stored = {data:[]};
var _watching = {data:null};

var GetJsonStore = {
    getAll: function () {
        return _responce;
    },
    dispatcherIndex: dispatcher.register(function (payload) {
        if (payload.actionType === "getJson") {
            _responce.data = payload.data;
        }
    })
};

var StoredJsonStore = Object.assign({}, EventEmitter.prototype, {
    getAll: function () {
        return _stored;
    },
    getWatching: function () {
        return _watching;
    },
    // イベントを発生させるメソッドの定義
    emitChange: function () {
        // イベント名"change"としてイベントを発生
        this.emit("change");
    },
    emitGetWatching: function () {
        this.emit("getWatching");
    },
    // イベントの監視（購読）とコールバックの定義
    addChangeListener: function (callback) {
        // "change"イベントの発生を取得したら、引数にセットされたコールバック関数を実行
        this.on("change", callback);
        this.on("getWatching", callback);
    },
    dispatcherIndex: dispatcher.register(function (payload) {
        if (payload.actionType === "registerJson") {
            _stored.data[_stored.data.length] = payload.data;
            // emitChange()メソッドを実行（イベント発生）
            StoredJsonStore.emitChange();
        } else if (payload.actionType === "removeJson") {

        } else if (payload.actionType === "getWatching") {
            _watching.data = payload.data;
            StoredJsonStore.emitGetWatching();
        }
    })
});

class ResultList extends React.Component {
    constructor() {
        super();
        this.watch = this.watch.bind(this);
    }
    watch(value) {
        console.log(value.name);
        RegisterJsonAction.registerJson(value);
    }
    render() {
        return (
            <tr key = {this.props.value.id}>
                <td>{this.props.value.name}</td> <td><button onClick={() => this.watch(this.props.value)}>watch</button></td>
            </tr>
        );
    }
}

class WatchingList extends React.Component {
    constructor() {
        super();
    }
    render() {
        return (
            <tr key = {this.props.value.id}>
                <td>{this.props.value.name}</td> <td><button onClick={() => this.unwatch(this.props.value)}>unwatch</button></td>
            </tr>
        );
    }
}
class WatchingRepositoryArea extends React.Component {
    constructor() {
        super();
        this.state = {storedData:[]};
        this.unwatch = this.unwatch.bind(this);
        GetWatchingAction.getWatching();
    }
    unwatch(value) {
        // console.log(value.name);
        // RegisterJsonAction.registerJson(value);
    }
    // コンポーネントが描画されたら実行
    componentDidMount() {
        var self = this;
        // TestStoreのaddChangeListener()メソッドにコールバック関数をセットし実行
        StoredJsonStore.addChangeListener(function () {
            // TestStore.getAll()を引数にセットし、setState()メソッドを実行
            // →Viewが再描画される
            // var storedData = StoredJsonStore.getAll();
            var storedData = StoredJsonStore.getWatching();
            self.setState({storedData:storedData.data});
        });
    }
    render() {
        var rows = [];
        if (this.state.storedData.length !== 0) {
            var storedData = this.state.storedData;
            for (var i=0;i<storedData.length;i++) {
                rows.push(<WatchingList value={storedData[i]} key={storedData[i].id}></WatchingList>);
            }
        }
        return (
            <table>
                <tbody>
                    {rows}
                </tbody>
            </table>
        );
    }
}

class SearchRepositoryForm extends React.Component {
    constructor() {
        super();
        this.state = {returnedData : null, query: ""};
        this.send = this.send.bind(this);
        this.handleChangeInput = this.handleChangeInput.bind(this);
    }
    send() {
        var url = "https://api.github.com/search/repositories?q=" + this.state.query + "+language:assembly&sort=stars&order=desc";
        GetJsonAction.getJson(url, "", () => {
            var responce = GetJsonStore.getAll();
            this.setState({
                returnedData: responce.data
            });
            console.log(responce.data);
        });
    }
    handleChangeInput(event) {
        var query = event.target.value;
        this.setState({
            query: query
        });
        this.send();
    }
    render() {
        var rows = [];
        if (this.state.returnedData != null ) {
            for (var i = 0; i < this.state.returnedData.total_count; i++) {
                var item = this.state.returnedData.items[i]
                if (item != null) {
                    // rows.push(<li key= {i}>{this.state.returnedData.items[i].name}</li>);
                    rows.push(<ResultList value ={item} key={item.id}></ResultList>);
                } else {
                    break;
                }
            }
        }
        return (
            <div>
                <input type="text" value={this.state.query} onChange={this.handleChangeInput}/>
                <table>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        );
  }
}

ReactDOM.render(
    <SearchRepositoryForm />,
    document.getElementById('searcher')
);

ReactDOM.render(
    <WatchingRepositoryArea />,
    document.getElementById('watching')
);

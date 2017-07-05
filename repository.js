var dispatcher = new Flux.Dispatcher();
var token = 'token f1808b332491275546b95996a4563c588659a381'; // Personal access token
var _search = {data:null}; // 検索結果を入れるオブジェクト
var _watching = {data:null}; // 現在watchしているものを入れるオブジェクト

//
// searching & registering watch
//

// 入力した文字でrepositoryを検索するAction
var searchAction = {
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
    search: function (url, query, viewCallback) {
        this.sendGetRequest(url, query, viewCallback, function(returnedJson){
            var json = returnedJson;
            dispatcher.dispatch({
                actionType: "search",
                data: json
            });
            viewCallback();
        });
    }
};

// 選択したrepositoryをwatchに登録するAction
var watchAction = {
    watch: function(selectedJson) {
        var request = new XMLHttpRequest();
        var fullName = selectedJson.full_name;
        var url = "https://api.github.com/repos/" + fullName + "/" + "subscription";
        var params = {
            subscribed: true,
            ignored: false
        };
        request.open('PUT', url, true);
            request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            request.setRequestHeader('Authorization',token);
            request.onreadystatechange = function(){
                if (request.readyState === 4 && request.status === 200){
                    dispatcher.dispatch({
                        actionType: "watch",
                        data: selectedJson
                    });
                } else if (request.readyState === 4 && request.status !== 200){
                    alert('error');
                }
            };
            request.send(JSON.stringify(params));
    }
}

// searchAction と watchAction からのデータを受け取るStore
var searchStore = {
    getAll: function () {
        return _search;
    },
    dispatcherIndex: dispatcher.register(function (payload) {
        if (payload.actionType === "search") {
            _search.data = payload.data;
        } else if (payload.actionType === "watch") {
            GetWatchingAction.getWatching();
        }
    })
};

// 検索結果を表示するためのComponent
class ResultList extends React.Component {
    constructor() {
        super();
        this.watch = this.watch.bind(this);
    }
    watch(value) {
        watchAction.watch(value);
    }
    render() {
        return (
            <tr key = {this.props.value.id}>
                <td>{this.props.value.name}</td> <td><button onClick={() => this.watch(this.props.value)}>watch</button></td>
            </tr>
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
        searchAction.search(url, "", () => {
            var responce = searchStore.getAll();
            this.setState({
                returnedData: responce.data
            });
        });
    }
    handleChangeInput(event) {
        var query = event.target.value;
        var time = setTimeout(() => {
            this.setState({
                query: query
            });
            this.send();
        }, 1);
    }
    render() {
        var rows = [];
        if (this.state.returnedData != null ) {
            for (var i = 0; i < this.state.returnedData.total_count; i++) {
                var item = this.state.returnedData.items[i]
                if (item != null) {
                    rows.push(<ResultList value ={item} key={item.id}></ResultList>);
                } else {
                    break;
                }
            }
        }
        return (
            <div>
                search:<input type="text" value={this.state.query} onChange={this.handleChangeInput}/>
                <table>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        );
  }
}
// 検索結果を表示するためのComponentのレンダリング
ReactDOM.render(
    <SearchRepositoryForm />,
    document.getElementById('searcher')
);
//
// /searching & register watch
//

//
// display watching & register unwatch
//

// 現在watch状態であるrepositoryを取得するAction
var GetWatchingAction = {
    getWatching: function() {
        var request = new XMLHttpRequest();
        var url = "https://api.github.com/user/subscriptions";
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
                    // viewCallback();
                }
                else if (request.readyState === 4 && request.status !== 200){
                    alert('error');
                }
            };
            request.send();
    },
}

// 選択したrepositoryをunwatchにするAction
var unwatchAction = {
    unwatch: function(selectedJson) {
        var request = new XMLHttpRequest();
        var fullName = selectedJson.full_name;
        var url = "https://api.github.com/repos/" + fullName + "/" + "subscription";
        request.open('DELETE', url, true);
            request.setRequestHeader('Authorization',token);
            request.onreadystatechange = function(){
                if (request.readyState === 4 && request.status === 204){
                    dispatcher.dispatch({
                        actionType: "unwatch"
                    });
                }
            };
            request.send();
    }
}

// GetWatchingActionとunwatchActionからデータを受け取るStore
var StoredJsonStore = Object.assign({}, EventEmitter.prototype, {
    getAllWatching: function () {
        return _watching;
    },
    emitGetAllWatching: function () {
        this.emit("getAllWatching");
    },
    addChangeListener: function (callback) {
        this.on("getAllWatching", callback);
    },
    dispatcherIndex: dispatcher.register(function (payload) {
        if (payload.actionType === "getWatching") {
            _watching.data = payload.data;
            StoredJsonStore.emitGetAllWatching();
        } else if (payload.actionType === "unwatch") {
            GetWatchingAction.getWatching();
        }
    })
});

// 現在watch状態であるrepositoryを表示するComponent
class WatchingList extends React.Component {
    constructor() {
        super();
        this.unwatch = this.unwatch.bind(this);
    }
    unwatch(value) {
        unwatchAction.unwatch(value);
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
        GetWatchingAction.getWatching();
    }
    componentDidMount() {
        var self = this;
        StoredJsonStore.addChangeListener(function () {
            var storedData = StoredJsonStore.getAllWatching();
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

// 現在watch状態であるrepositoryを表示するComponentのレンダリング
ReactDOM.render(
    <WatchingRepositoryArea />,
    document.getElementById('watching')
);

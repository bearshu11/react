var dispatcher = new Flux.Dispatcher();
var token = 'token ';

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
                }
                else if (request.readyState === 4 && request.status !== 200){
                    alert('error');
                }
            };
            request.send();
    },
}

var unwatchAction = {
    unwatch: function(selectedJson) {
        var request = new XMLHttpRequest();
        var fullName = selectedJson.full_name;
        console.log(fullName);
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

var _watching = {data:null};

var StoredJsonStore = Object.assign({}, EventEmitter.prototype, {
    getWatching: function () {
        return _watching;
    },
    emitGetWatching: function () {
        this.emit("getWatching");
    },
    addChangeListener: function (callback) {
        this.on("getWatching", callback);
    },
    dispatcherIndex: dispatcher.register(function (payload) {
        if (payload.actionType === "getWatching") {
            _watching.data = payload.data;
            console.log(_watching);
            StoredJsonStore.emitGetWatching();
        } else if (payload.actionType === "unwatch") {
            GetWatchingAction.getWatching();
        }
    })
});

class WatchingList extends React.Component {
    constructor() {
        super();
        this.unwatch = this.unwatch.bind(this);
    }
    unwatch(value) {
        console.log(value);
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
                console.log(storedData[i]);
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

ReactDOM.render(
    <WatchingRepositoryArea />,
    document.getElementById('watching')
);

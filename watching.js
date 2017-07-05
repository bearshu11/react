var dispatcher = new Flux.Dispatcher();

var GetWatchingAction = {
    getWatching: function() {
        var request = new XMLHttpRequest();
        var url = "https://api.github.com/user/subscriptions";
        var token = 'token ';
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

var _watching = {data:null};

var StoredJsonStore = Object.assign({}, EventEmitter.prototype, {
    getWatching: function () {
        return _watching;
    },
    // イベントを発生させるメソッドの定義
    emitGetWatching: function () {
        this.emit("getWatching");
    },
    // イベントの監視（購読）とコールバックの定義
    addChangeListener: function (callback) {
        // "change"イベントの発生を取得したら、引数にセットされたコールバック関数を実行
        // this.on("change", callback);
        this.on("getWatching", callback);
    },
    dispatcherIndex: dispatcher.register(function (payload) {
        if (payload.actionType === "getWatching") {
            _watching.data = payload.data;
            console.log(_watching);
            StoredJsonStore.emitGetWatching();
        }
    })
});

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

ReactDOM.render(
    <WatchingRepositoryArea />,
    document.getElementById('watching')
);

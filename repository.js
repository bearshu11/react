var dispatcher = new Flux.Dispatcher();
var token = 'token 6353dfa5a5111622e6837d72041ca02ef68ad86a';

var _search = {data:null};
var _watching = {data:null};

// searching & registering watch
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

var watchAction = {
    watch: function(selectedJson) {
        var request = new XMLHttpRequest();
        var fullName = selectedJson.full_name;
        console.log(fullName);
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

class ResultList extends React.Component {
    constructor() {
        super();
        this.watch = this.watch.bind(this);
    }
    watch(value) {
        console.log(value.name);
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
            console.log(responce.data);
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

// /searching & register watch

// display watching & register unwatch
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
            console.log(_watching);
            StoredJsonStore.emitGetAllWatching();
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
    componentDidMount() {
        var self = this;
        StoredJsonStore.addChangeListener(function () {
            var storedData = StoredJsonStore.getAllWatching();
            self.setState({storedData:storedData.data});
            console.log("HELLOHELLO");
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

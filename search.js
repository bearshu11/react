var dispatcher = new Flux.Dispatcher();
var _search = {data:null};
var token = 'token ';

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
            console.log("HELLO!");
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

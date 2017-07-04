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
                json: json
            });
            viewCallback();
        });
    }
};

var _responce = {json:null};

var GetJsonStore = {
    getAll: function () {
        return _responce;
    },
    dispatcherIndex: dispatcher.register(function (payload) {
        if (payload.actionType === "getJson") {
            _responce.json = payload.json;
        }
    })
};

class ResultList extends React.Component {
    constructor() {
        super();
    }
    render() {
        return (
            <li></li>
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
                returnedData: responce.json
            });
            console.log(responce.json);
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
                if (this.state.returnedData.items[i] != null) {
                    rows.push(<li key= {i}>{this.state.returnedData.items[i].name}</li>);
                } else {
                    break;
                }
            }
        }
        return (
            <div>
                <input type="text" value={this.state.query} onChange={this.handleChangeInput}/>
                <ul>
                    {rows}
                </ul>
            </div>
        );
  }
}

ReactDOM.render(
    <SearchRepositoryForm />,
    document.getElementById('searcher')
);

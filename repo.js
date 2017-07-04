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
    return (
        <li></li>
    );
}

class SearchRepositoryForm extends React.Component {
    constructor() {
        super();
        this.state = {value : {}, query: ""};
        this.send = this.send.bind(this);
        this.handleChangeInput = this.handleChangeInput.bind(this);
    }
    send() {
        var url = "https://api.github.com/search/repositories?q=" + this.state.query + "+language:assembly&sort=stars&order=desc";
        GetJsonAction.getJson(url, "", function() {
            var responce = GetJsonStore.getAll();
            console.log(responce.json.items);
        });

        // this.setState(GetJsonStore.getAll());
    }
    handleChangeInput(event) {
        var query = event.target.value;
        this.setState({
            query: query
        });
    }
    render() {
        return (
            <div>
                <form action="javascript:void(0)" onSubmit={this.send}>
                    <input type="text" value={this.state.name} onChange={this.handleChangeInput}/>
                    <button className="SearchRepositoryForm" type="submit">
                        Search
                    </button>
                </form>
                <ul>
                </ul>
            </div>
        );
  }
}

ReactDOM.render(
    <SearchRepositoryForm />,
    document.getElementById('searcher')
);

// Um desenvolvedor tentou criar um projeto que consome a base de dados de filme do TMDB para criar um organizador de filmes, mas desistiu 
// pois considerou o seu código inviável. Você consegue usar typescript para organizar esse código e a partir daí aprimorar o que foi feito?

// A ideia dessa atividade é criar um aplicativo que: 
//    - Busca filmes
//    - Apresenta uma lista com os resultados pesquisados
//    - Permite a criação de listas de filmes e a posterior adição de filmes nela

// Todas as requisições necessárias para as atividades acima já estão prontas, mas a implementação delas ficou pela metade (não vou dar tudo de graça).
// Atenção para o listener do botão login-button que devolve o sessionID do usuário
// É necessário fazer um cadastro no https://www.themoviedb.org/ e seguir a documentação do site para entender como gera uma API key https://developers.themoviedb.org/3/getting-started/introduction
//#region DOMs
let loginButton = document.getElementById('login-button') as HTMLButtonElement;
let listButton = document.getElementById('lista-button') as HTMLButtonElement;
let searchButton = document.getElementById('search-button') as HTMLButtonElement;
//#endregion
let requestToken: string;
let sessionId: string;
let listId: number;
const _reqAuth: ReqAuth = {
    username: "",
    password: "",
    apiKey: ""
}
validateLoginButton();
loginButton?.addEventListener('click', async () => {
    if (!validateLoginButton())
        return;
    await criarRequestToken();
    await logar();
    await criarSessao();
})

searchButton?.addEventListener('click', async () => {
    let tbody = document.getElementById("tbodyResultado");
    if (tbody) {
        tbody.querySelectorAll('tr').forEach(item => {
            item.remove();
        })
    }
    let query = TryParseHtmlInput(document.getElementById('search')).value;
    if (!query || !query.trim()) {
        alert("Favor Preencher");
        TryParseHtmlInput(document.getElementById('search')).value = "";
        return;
    }
    let listaDeFilmes = await procurarFilme(query);
    for (const item of listaDeFilmes.results) {
        let tr = document.createElement('tr');
        tr.id = `re_${item.id}`;
        let td = document.createElement('td');
        td.appendChild(document.createTextNode(item.original_title))
        tr.append(td)
        tbody?.appendChild(tr);
    }
})
listButton?.addEventListener('click', async () => {
    const result = await criarLista(_reqLista.name, _reqLista.description);
    listId = result.list_id
    ShowOrHideElement('#frmcriarlista')
    ShowOrHideElement('#sectionnomelista', true);
    document.getElementById('nomeLista')!.innerText = _reqLista.name;
})
function TryParseHtmlInput(element: HTMLElement | null) {
    return element as HTMLInputElement
}
function ShowOrHideElement(selector: string, show: boolean = false) {
    (document.querySelector(selector) as HTMLElement).style.display = show ? 'block' : 'none'
}
function preencherLogin(e: HTMLInputElement) {
    if (e.name in _reqAuth)
        _reqAuth[e.name as keyof ReqAuth] = e.value
    console.log(_reqAuth)
    validateLoginButton();
}

function validateLoginButton() {
    const ExisteValorNosCampos = (!!_reqAuth.password && !!_reqAuth.username && !!_reqAuth.apiKey)
    console.log(ExisteValorNosCampos)
    if (ExisteValorNosCampos) {
        loginButton.disabled = false;
    } else {
        loginButton.disabled = true;
    }
    return ExisteValorNosCampos;
}
const _reqLista: ReqLista = {
    name: '',
    description: ''
}
function preencherReqLista(e: HTMLInputElement) {
    if (e.name in _reqLista)
        _reqLista[e.name as keyof ReqLista] = e.value
    validateListaButton();
}
function validateListaButton() {
    if (!_reqLista.name)
        return alert('Favor prencher o campo nome obrigatorio')
}

//#region Interfaces e Types
type Res = {}
type ReqLista = {
    name: string,
    description: string
}
type ResList = {
    list_id: number
    status_code: number
    status_message: string;
    success: boolean
}
type ReqAuth = {
    username: string,
    password: string,
    apiKey: string
}
type Req = {
    url: string,
    method: 'POST' | 'GET',
    body?: {}
}
type ResSeach = {
    page: number;
    total_pages: number;
    total_results: number;
    results: IFilme[]
}
type AuthRes = {
    request_token: string
}
type SessionRes = {
    session_id: string
}
interface IFilme {
    adult: boolean;
    backdrop_path: string | null;
    genre_ids: number[];
    id: number;
    original_language: string;
    original_title: string;
    overview: string;
    popularity: number;
    poster_path: string;
    release_date: Date;
    title: string;
    video: boolean;
    vote_average: number;
    vote_count: number
}
//#endregion

class HttpClient {
    static async Req<T>({ url, method, body }: Req) {
        const request = await fetch(url, {
            headers: {
                "Content-Type": "application/json;charset=utf-8"
            },
            method: method,
            body: JSON.stringify(body)
        });
        if (!request.ok) {
            if (request.status == 401) {
                alert('favor logar novamente');
            }
            throw {
                status: request.status,
                statusText: request.statusText
            }
        }

        return await request.json() as T;
    }
}

async function procurarFilme(query: string) {
    query = encodeURI(query)
    console.log(query)
    let result = await HttpClient.Req<ResSeach>({
        url: `https://api.themoviedb.org/3/search/movie?api_key=${_reqAuth.apiKey}&query=${query}`,
        method: "GET"
    })
    return result
}

async function adicionarFilme(filmeId: number) {
    let result = await HttpClient.Req<Res>({
        url: `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${_reqAuth.apiKey}&language=en-US`,
        method: "GET"
    })
    console.log(result);
}

async function criarRequestToken() {
    let result = await HttpClient.Req<AuthRes>({
        url: `https://api.themoviedb.org/3/authentication/token/new?api_key=${_reqAuth.apiKey}`,
        method: "GET"
    })
    requestToken = result.request_token
}

async function logar() {
    await HttpClient.Req({
        url: `https://api.themoviedb.org/3/authentication/token/validate_with_login?api_key=${_reqAuth.apiKey}`,
        method: "POST",
        body: {
            username: `${_reqAuth.username}`,
            password: `${_reqAuth.password}`,
            request_token: `${requestToken}`
        }
    })
}

async function criarSessao() {
    let result = await HttpClient.Req<SessionRes>({
        url: `https://api.themoviedb.org/3/authentication/session/new?api_key=${_reqAuth.apiKey}&request_token=${requestToken}`,
        method: "GET"
    })
    sessionId = result.session_id;
}

async function criarLista(nomeDaLista: string, descricao: string) {
    let result = await HttpClient.Req<ResList>({
        url: `https://api.themoviedb.org/3/list?api_key=${_reqAuth.apiKey}&session_id=${sessionId}`,
        method: "POST",
        body: {
            name: nomeDaLista,
            description: descricao,
            language: "pt-br"
        }
    })
    return result;
}

async function adicionarFilmeNaLista(filmeId: number, listaId: number) {
    let result = await HttpClient.Req({
        url: `https://api.themoviedb.org/3/list/${listaId}/add_item?api_key=${_reqAuth.apiKey}&session_id=${sessionId}`,
        method: "POST",
        body: {
            media_id: filmeId
        }
    })
    console.log(result);
}

async function pegarLista() {
    let result = await HttpClient.Req({
        url: `https://api.themoviedb.org/3/list/${listId}?api_key=${_reqAuth.apiKey}`,
        method: "GET"
    })
    console.log(result);
}


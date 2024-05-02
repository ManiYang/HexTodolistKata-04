const http = require("http");
const { v4: uuidv4 } = require("uuid");

const httpListenPort = process.env.PORT || 3005;

const responseHeaders = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
    'Content-Type': 'application/json'
};

/**
 * Sends "successful" response.
 * @param res 
 * @param data If not `null`, this is the value of key "data" in the response body. If is `null`, the response does not have a body.
 */
function respondAsSuccessful(res, data) {
    res.writeHead(200, responseHeaders);
    if (data !== null) {
        res.write(JSON.stringify({
            "status": "ok",
            "data": data
        }));
    }
    res.end();
}

/**
 * Sends "failed" response.
 */
function respondAsFailed(res, httpCode, message) {
    res.writeHead(httpCode, responseHeaders);
    res.write(JSON.stringify({
        "status": "failed",
        "message": message
    }));
    res.end();
}

/**
 * Parse `body` as JSON and get the value of key "title". Throws an Error if key "title" is not found.
 * @param {String} body 
 * @returns 
 */
function getTitleFromReqBody(body) {
    const title = JSON.parse(body).title;
    if (title === undefined) {
        throw new Error('title 未填寫');
    }
    return title;
}

//

const todos = [];

/**
 * @param {Array} todoList 
 * @param {String} id 
 * @returns -1 if not found
 */
function findTodoIndexById(todoList, id) {
    return todos.findIndex((item) => item.id === id);
}

//

function httpListener(req, res) {
    let body = "";
    req.on("data", (chunck) => {body += chunck;});

    if (req.url === "/todos" && req.method === "GET") {
        respondAsSuccessful(res, todos);
    }
    else if (req.url === "/todos" && req.method === "POST") {
        req.on("end", () => {
            try {
                const title = getTitleFromReqBody(body);
                const id = uuidv4();
                todos.push({ id, title });

                respondAsSuccessful(res, todos);
            } catch(error) {
                respondAsFailed(res, 400, error.message);
            }
        });
    }
    else if (req.url === "/todos" && req.method === "DELETE") { 
        // delete all todos
        todos.length = 0;
        respondAsSuccessful(res, todos);
    }
    else if (req.url.startsWith("/todos/") && req.method === "DELETE") { 
        // delete single todo
        const id = req.url.split("/").pop();
        const index = findTodoIndexById(todos, id);
        
        if (index == -1) {
            respondAsFailed(res, 404, "找不到該 todo");
        } else {
            todos.splice(index, 1);
            respondAsSuccessful(res, todos);
        }
    }
    else if (req.url.startsWith("/todos/") && req.method === "PATCH") {
        req.on("end", () => {
            try {
                const title = getTitleFromReqBody(body);

                const id = req.url.split("/").pop();
                const index = findTodoIndexById(todos, id);

                if (index == -1) {
                    respondAsFailed(res, 404, "找不到該 todo");
                } else {
                    todos[index].title = title;
                    respondAsSuccessful(res, todos);
                }
            } catch(error) {
                respondAsFailed(res, 404, error.message);
            }
        });
    }


    else if (req.method === "OPTIONS") {
        respondAsSuccessful(res, null);
    }
    else {
        respondAsFailed(res, 404, "無此路由");
    }
}

http.createServer(httpListener).listen(httpListenPort);

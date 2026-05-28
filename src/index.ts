import * as http from "http";

type Post = {
  id: number;
  title: string;
  body: string;
  userId: number;
};

let posts: Post[] = [
  {
    id: 1,
    title: "First post",
    body: "This is my first post",
    userId: 1
  }
];

const PORT = 3000;

function sendJSON(res: http.ServerResponse, statusCode: number, data: unknown) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function getBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const method = req.method;
  const url = req.url;

  if (url === "/") {
    sendJSON(res, 200, { message: "Server is running!" });
    return;
  }

  if (url === "/posts" && method === "GET") {
    sendJSON(res, 200, posts);
    return;
  }

  if (url?.startsWith("/posts/") && method === "GET") {
    const id = Number(url.split("/")[2]);
    const post = posts.find(post => post.id === id);

    if (!post) {
      sendJSON(res, 404, { message: "Post not found" });
      return;
    }

    sendJSON(res, 200, post);
    return;
  }

  if (url === "/posts" && method === "POST") {
    const body = await getBody(req);

    const newPost: Post = {
      id: posts.length + 1,
      title: body.title,
      body: body.body,
      userId: body.userId
    };

    posts.push(newPost);
    sendJSON(res, 201, newPost);
    return;
  }

  if (url?.startsWith("/posts/") && method === "PUT") {
    const id = Number(url.split("/")[2]);
    const body = await getBody(req);

    const index = posts.findIndex(post => post.id === id);

    if (index === -1) {
      sendJSON(res, 404, { message: "Post not found" });
      return;
    }

    posts[index] = {
      id,
      title: body.title,
      body: body.body,
      userId: body.userId
    };

    sendJSON(res, 200, posts[index]);
    return;
  }

  if (url?.startsWith("/posts/") && method === "PATCH") {
    const id = Number(url.split("/")[2]);
    const body = await getBody(req);

    const post = posts.find(post => post.id === id);

    if (!post) {
      sendJSON(res, 404, { message: "Post not found" });
      return;
    }

    Object.assign(post, body);

    sendJSON(res, 200, post);
    return;
  }

  if (url?.startsWith("/posts/") && method === "DELETE") {
    const id = Number(url.split("/")[2]);

    const postExists = posts.some(post => post.id === id);

    if (!postExists) {
      sendJSON(res, 404, { message: "Post not found" });
      return;
    }

    posts = posts.filter(post => post.id !== id);

    sendJSON(res, 200, { message: "Post deleted successfully" });
    return;
  }

  sendJSON(res, 404, { message: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
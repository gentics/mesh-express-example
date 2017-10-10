# Gentics Mesh Express Example

This example shows how to use [Gentics Mesh](https://getmesh.io) in combination with [Express](http://expressjs.com/). 

The Gentics Mesh GraphQL API is used to located the requested content. The JSON information of that content is used to render various [Nunjucks](https://mozilla.github.io/nunjucks/) templates.

## Getting Started

```
# Clone example project
git clone git@github.com:gentics/mesh-express-example.git
cd mesh-express-example

# Install needed dependencies 
npm install

# Download Gentics Mesh from https://getmesh.io/Download and start it
java -jar mesh-demo-xx.xx.xx.jar

# Start the express server
node index.js

# Access http://localhost:3000 in your browser
```

## Other variations of this demo

The variations are located in different branches within this repo.

* [GraphQL](https://github.com/gentics/mesh-express-example/tree/graphql) - `master` - This example will use anonymous access and load the contents via GraphQL.

* [Basic auth](https://github.com/gentics/mesh-express-example/tree/basic-auth) - `basic-auth` - This example will use basic auth to authenticate the requests and use the REST API to load the contents.

* [Anonymous access](https://github.com/gentics/mesh-express-example/tree/anonymous-access) - `anonymous-access` - This example will use no authentication and thus use the anonymous access funtionality of Gentics Mesh. The contents will be loaded via the WebRoot REST endpoint.


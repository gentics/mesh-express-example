# Gentics Mesh Express Example

This example shows how to use [Gentics Mesh](https://getmesh.io) in combination with [Express](http://expressjs.com/). 

The Gentics Mesh GraphQL API is used to located the requested content. The JSON information of that content is used to render various [Nunjucks](https://mozilla.github.io/nunjucks/) templates.

## Getting Started

```
# Clone example project
git clone git@github.com:gentics/mesh-express-example.git
git checkout graphql
cd mesh-express-example

# Install needed dependencies 
npm install

# Download Gentics Mesh from https://getmesh.io/Download and start it
java -jar mesh-demo-0.9.xx.jar

# Start the express server
node index.js

# Access http://localhost:3000 in your browser
```

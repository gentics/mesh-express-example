# Gentics Mesh ExpressJS Example

This example shows how to use [Gentics Mesh](http://getmesh.io) in combination with [ExpressJS](http://expressjs.com/). 

The Gentics Mesh Webroot API is being used to located the requested content. The JSON information of that content is used to render various [Nunjucks](https://mozilla.github.io/nunjucks/) templates.

## Getting Started

```
# Clone example project
git clone git@github.com:gentics/mesh-express-example.git
cd mesh-express-example

# Install needed dependencies 
npm install

# Downlad Gentics Mesh from http://getmesh.io/Download and start it
java -jar mesh-demo-0.6.xx.jar

# Start the express server
node index.js

# Access http://localhost:3000 in your browser
```


"use strict";
const express = require('express')
const request = require('request');
const rp = require('request-promise');
const nunjucks = require('nunjucks');
const app = express();

nunjucks.configure('views', {
  autoescape: true,
  express: app
});

var BASEURI = "http://localhost:8080/api/v1/";
var cookieJar = rp.jar();

function login() {
  let options = {
    uri: BASEURI + "auth/login",
    auth: {
        'user': 'webclient',
        'pass': 'webclient',
        'sendImmediately': true
     },
     jar: cookieJar 
  }
  return rp(options);
}

/**
 * Load the breadcrumb information for the root level of the project.
 * @return {Promise} Promise with breadcrumb information
 */
function loadBreadcrumbData() {
  let options = {
    uri: BASEURI + "demo/navroot/?maxDepth=1&resolveLinks=short",
    jar: cookieJar, 
    json: true
  }
  return rp(options).then(result => result.children);
}

/**
 * Load a list of children for the specified node.
 * @param uuid Uuid of the node
 * @return {Promise} Promise with children information for the located node
 */
function loadChildren(uuid) {
  let options = {
    uri: BASEURI + "demo/nodes/" + uuid + "/children?expandAll=true&resolveLinks=short",
    jar: cookieJar,
    json: true
  }
  return rp(options).then(result => result.data);
}

login().then(loginResp => {
  console.log("Login in Gentics Mesh successful");
  // Dedicated route for the welcome page
  app.get("/", (req, res) => {
    loadBreadcrumbData().then(data => {
      res.render('welcome.njk', {
        breadcrumb: data
      });
    });
  });

  // Webroot path route which consumes all other paths in order to fetch the corresponding Gentics Mesh node and render its contents.
  app.get('*', (req, res) => {
    let path = req.params[0];
    console.log("Handling path {" + path + "}");

    // 1. Use the webroot endpoint to resolve the path to a Gentics Mesh node. The node information will later 
    // be used to determine which nunjucks template to use in order to render the page.
    let uri = BASEURI + "demo/webroot/" + encodeURIComponent(path) + "?resolveLinks=short";
    let options = {
      uri: uri,
      jar: cookieJar,
      resolveWithFullResponse: true,
      json: true,
      // Enable direct buffer handling for the request api in order to allow binary data passthru for images.
      encoding: null
    }
    rp(options).then(response => {
      let contentType = response.headers['content-type'];

      // 2. Check whether the found node represents an image. Otherwise continue with template specific code.
      if (contentType.startsWith("image/")) {
        res.contentType(contentType).send(response.body);
      } else {
        let elementJson = response.body;
        let uuid = elementJson.uuid;
        let schemaName = elementJson.schema.name;
        let navigationPromise = loadBreadcrumbData();

        switch (schemaName) {
          // Check whether the loaded node is a vehicle node. In those cases a detail page should be shown.
          case "vehicle":
            console.log("Handling vehicle request");
            navigationPromise.then(navData => {
              res.render('productDetail.njk', {
                'breadcrumb': navData,
                'product': elementJson
              });
            });
            break;

          // Show the product list page for category nodes
          case "category":
            console.log("Handling category request");
            let childrenPromise = loadChildren(uuid);
            Promise.all([navigationPromise, childrenPromise]).then(data => {
              const [navigationData, childrenData] = data;
              res.render('productList.njk', {
                'breadcrumb': navigationData,
                'category': elementJson,
                'products': childrenData
              });
            }).catch(err => {
              console.log("Error while resolving promises {" + err.message + "}");
              res.status(500).send("Oh uh, something went wrong");
            });
            break;

          // Show 404 or error for other nodes
          default:
            res.status(404).send("Unknown element type for given path");
            break;
        }
      }
    }).catch(err => {
      if (err.statusCode == 404) {
        res.status(404).send("Page not found");
      } else {
        console.log("Error {" + err.message + "}");
        res.status(500).send("Oh uh, something went wrong");
      }
    });
  });

  // Start the ExpressJS server on port 3000
  app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });
});

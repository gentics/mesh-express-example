var express = require('express')
var request = require('request');
var rp = require('request-promise');
var nunjucks = require('nunjucks');
var app = express();

nunjucks.configure('views', {
  autoescape: true,
  express: app
});

var BASEURI = "http://admin:admin@localhost:8080/api/v1/";

/**
 * Load the breadcrumb information for the root level of the project.
 * @return {Promise} Promise with breadcrumb information
 */
function loadBreadcrumbData() {
  let uri = BASEURI + "demo/navroot/?maxDepth=1&resolveLinks=short";
  let options = {
    uri:  uri,
    json: true
  } 

  return rp(options).then(result => result.root.children);
}

/**
 * Load a list of children for the specified node.
 * @param uuid Uuid of the node
 */
function loadChildren(uuid) {
  let uri = BASEURI + "demo/nodes/" + uuid + "/children?expandAll=true&resolveLinks=short";
  return rp(uri).then(result => result.data);
}

app.get("/", function (req, res) {
  loadBreadcrumbData().then(function (data) {
    res.render('welcome.njk', {
      breadcrumb: data
    });
  });
});

app.get('*', function (req, res) {
  let path = req.params[0];
  console.log("Path: " + path);

  // 1. Use the webroot endpoint to resolve the path to a Gentics Mesh node. The node information will later 
  // be used to determine which twig template to use in order to render the page.
  let uri = BASEURI + "demo/webroot/" + encodeURIComponent(path) + "?resolveLinks=short";
  let options = {
    uri: uri,
    resolveWithFullResponse: true
  }

  rp(options).then(function (resolvedElement) {

    // 2. Check whether the found node represents an image. Otherwise continue with template specific code.
    if (substr(response.content_type, 0, 6) === "image/") {
      res.send(resolvedElement);
    } else {
      uuid = resolvedElement.uuid;

      let schemaName = resolvedElement.schema.name;
      let navigationData = loadBreadcrumbData();

      switch (schemaName) {
        // Check whether the loaded node is an vehicle node. In those cases a detail page should be shown.
        case "vehicle":
          Promise.all([children, navigationData]).then(results => {
            res.render('productDetail.njk', {
              'breadcrumb': results[1],
              'product': resolvedElement
            });
          });
          break;

        // Show the product list page for category nodes
        case "category":
          let children = loadChildren(uuid);
          res.render('productList.njk', {
            'breadcrumb': navigationData,
            'category': resolvedElement,
            'products': children
          });
          break;

        // Show 404 or error for other nodes
        default:
          res.send("Unknown element type");
          break;
      }
    }
  }).catch(function (err) {
    if (err.statusCode == 404) {
      res.status(404).send("Page not found");
    } else {
      console.log("Error {" + err.message + "}");
      res.status(500).send("Oh uh, something went wrong");
    }
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});




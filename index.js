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

// You can also directly connect to our demo server
// var BASEURI = "https://demo.getmesh.io/api/v1/";
var BASEURI = "http://localhost:8080/api/v1/";

/**
 * Load the top navigation information for the root level of the project.
 * @return {Promise} Promise with navigation information
 */
function loadTopNav() {
  let options = {
    uri: BASEURI + "demo/graphql/",
    method: "POST",
    body: {
           query:
           `{
                project {
                  rootNode {
                    children {
                      elements {
                        schema {
                          name
                        }
                        path
                        fields {
                          ... on category {
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }`
  },
    json: true
  };
  return rp(options).then(data => data.data);
}

/**
 * Determines if the requested resource is binary content
 * @param path
 * @return boolean
 */
function isBinary(path) {
  return path.startsWith('/images/') || path.endsWith('.jpg');
}

/**
 * Load navigation, category and/or vehicle information in one combined GraphQL request
 * @param path
 * @return {Promise} Promise with all data
 */
function loadViaGraphQL(path) {
  let options = {
    uri: BASEURI + "demo/graphql",
    method: "POST",
  	body: {
      variables: { "path": "/" + path },
      query:
      `query($path: String) {
        # We need to load the children of the root node of the project. 
        # Those nodes will be used to construct our top navigation.
        project {
          rootNode {
            children {
              elements {
                # Include the schema so that we can filter our the images node. 
                # This node should not be part of the top nav
                schema {
                  name
                }
                path
                fields {
                  ... on category {
                    name
                  }
                }
              }
            }
          }
        }
        # Load the node with the specified path. This can either be a vehicle or a category.
        node(path: $path) {
          uuid
          # Include the schema so that we can switch between our two schemas. 
          # E.g.: productDetail for vehicles and productList for categories nodes
          schema { 
            name 
          }
          fields {
            ... on category {
              slug
              description
              name
            }
            ... on vehicleImage {
              name
            }
            ...productInfo
          }
          # Include the child nodes for categories. 
          # This information is used to list the vehicles in the productList view
          products: children {
            elements {
              path
              uuid
              fields {
                ...productInfo
              }
            }
          }
        }
      }
      # We need to load the fields in two places. 
      # Thus it makes sense to use a fragment and only specify them once.
      fragment productInfo on vehicle {
        slug
        name
        SKU
        description
        price
        weight
        stocklevel
        vehicleImage {
          path
        }
      }`
    },
    json: true
  };
  return rp(options).then(data => data.data);
}

// Dedicated route for the welcome page
app.get("/", (req, res) => {
  loadTopNav().then(data => {
    res.render('welcome.njk', {
      'navigation': data.project.rootNode.children.elements
    });
  });
});

// Webroot path route which consumes all other paths in order to fetch the corresponding Gentics Mesh node and render its contents.
app.get('*', (req, res) => {
  let path = req.params[0];
  console.log("Handling path {" + path + "}");

  //performance tweak: deliver binaries directly via webroot API
  if(isBinary(path)) {
    let uri = BASEURI + "demo/webroot/" + encodeURIComponent(path);
    let options = {
      uri: uri,
      resolveWithFullResponse: true,
      json: true,
      // Enable direct buffer handling for the request api in order to allow binary data passthru for images.
      encoding: null
    }
    rp(options).then(response => {
      let contentType = response.headers['content-type'];
      res.contentType(contentType).send(response.body);
    });
  } else {
    let graphQLResponse = loadViaGraphQL(path).then(data => {
      console.log(JSON.stringify(data));
      let schemaName = data.node.schema.name;
      switch (schemaName) {
        // Check whether the loaded node is a vehicle node. In those cases a detail page should be shown.
        case "vehicle":
          console.log("Handling vehicle request");
          res.render('productDetail.njk', {
            'navigation': data.project.rootNode.children.elements,
            'product': data.node
          });
          break;

        // Show the product list page for category nodes
        case "category":
          console.log("Handling category request");
          res.render('productList.njk', {
            'navigation': data.project.rootNode.children.elements,
            'category': data.node,
            'products': data.node.products.elements
          });
          break;

        // Show 404 or error for other nodes
        default:
          res.status(404).send("Unknown element type for given path");
          break;
      }
    }).catch(err => {
      if (err.statusCode == 404) {
        res.status(404).send("Page not found");
      } else {
        console.log("Error {" + err.message + "}");
        res.status(500).send("Oh uh, something went wrong");
      }
    });
  }
});


// Start the ExpressJS server on port 3000
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});


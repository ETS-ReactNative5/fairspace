# Ceres - RDF and SPARQL over HTTP

## How to build

`./gradlew clean build`


## How to run

```
# copy ceres-*.zip from <Ceres project directory>/build/distributions/
unzip ceres-*.zip
cd ceres-*/bin/
./ceres
```

## Configuration

To run with custom configuration
```
./ceres -config myconfig.conf
```

Default configuration file:

```
ktor {
  deployment {
    port = 8080
    port = ${?CERES_PORT}
  }

  application {
    modules = [io.fairspace.ceres.ModuleKt.ceresModule]
  }
}
jena {
  dataset {
    path = data
    path = ${?CERES_DATA_DIR}
  }
}
authentication {
  jwt {
    enabled = true
    enabled = ${?CERES_AUTH_ENABLED}

    issuer = "http://localhost:9080"
    issuer = ${?CERES_AUTH_ISSUER}

    realm = fairspace
    realm = ${?CERES_AUTH_REALM}

    audience = fairspace
    audience = ${?CERES_AUTH_AUDIENCE}
  }
}
```

Alternatively, you can use environment variables, e.g. `CERES_AUTH_ENABLED`, to alter configuration settings

See also: [Ktor configuration](https://ktor.io/servers/configuration.html#available-config)


## How to use

```
POST /models/mymodel/statements HTTP/1.1
Host: localhost:8080
Cache-Control: no-cache
Content-Type: application/rdf+json

{ 
  "http://somewhere/BillKidd" : { 
    "http://www.w3.org/2001/vcard-rdf/3.0#FN" : [ { 
      "type" : "literal" ,
      "value" : "Bill Kidd"
    }
     ] ,
    "http://www.w3.org/2001/vcard-rdf/3.0#N" : [ { 
      "type" : "bnode" ,
      "value" : "_:b764ccf5-ca28-4d3e-890c-46de043af0bb"
    }
     ]
  }
   ,
  "_:b764ccf5-ca28-4d3e-890c-46de043af0bb" : { 
    "http://www.w3.org/2001/vcard-rdf/3.0#Given" : [ { 
      "type" : "literal" ,
      "value" : "Bill"
    }
     ] ,
    "http://www.w3.org/2001/vcard-rdf/3.0#Family" : [ { 
      "type" : "literal" ,
      "value" : "Kidd"
    }
     ]
  }
}
```

```
GET /models/mymodel/statements HTTP/1.1
Host: localhost:8080
Cache-Control: no-cache
Accept: application/rdf+json
```

```
GET /models/mymodel/statements?subject=http://somewhere/BillKidd HTTP/1.1
Host: localhost:8080
Cache-Control: no-cache
Accept: application/rdf+json
```

```
DELETE /models/mymodel/statements?subject=http://somewhere/BillKidd HTTP/1.1
Host: localhost:8080
Cache-Control: no-cache
Content-Type: application/rdf+json
```

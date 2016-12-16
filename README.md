#Benman
Benchmark / load testing framework based on Postman collections.

#Quick Start

##Installation

```
npm install -g benman 
```

##Run postman collections

```
benman -p <Path to collection file>
```

Simple as it is.


#Advanced Usage

## Use from Command Line 

`benman` takes several parameters. You can find them by running `benman --help`:

```
$benman --help

  Usage: benman <-b | -p> [options] <path>

  Benchmark / load testing endpoints with Postman collections.

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -b, --benman               The benman config to run
    -p, --postman              The postman config to run
    -u, --usernumber <number>  The number of concurrent simulated users. Default: 1
    -l, --loopnumber <number>  Number of execution for each simulated user. Default: 5
    -r, --rampup <second>      Ramp up period for simulated user. Default: 0
    -a, --aggregator <name>    Name of result aggregator to use. Default: timeElapse
    --agent-url <agentUrl>     Optional. the agent url connect to. If omitted, a local agent will be spawned.
```


## Use as library in Node.js app

```
var benman=require("benman");
/**
benman.Agent //agent defines where to run load testing script. It can be local or remote
benman.Benman //Benman instance contains definition of all load testing script units / configurations . the instance also provides methods.
benman.Unit // A unit is a wrapper of postman collection to add fields like number of concurrent users / iteration count / ramp up period etc.
*/

benman.Agent.createLocalAgent({
	workerNum:4 //create a local agent with 4 child processes (workers)
})
.then(function(agent){
	return agent.connect() //connect to agent
	.then(function(){
		return agent.getStatus() //check agent status
	})
	.then(function(status){
		if (status.status ==="ready"){ //agent is ready for work
			return agent.run(myBenmanJSON); // run benman json configuration
		}else{
			//handle status.message
		}
	})
});
```


## Start from Postman
&nbsp;
 
 

# Agent



## Use from Command Line 
Set up Agents using `benman-agent` from the command line

`benman-agent` takes several parameters. You can find them by running `benman-agent --help`:


```
benman-agent --help

  Usage: benman-agent [options]

  Benman remote agent. Used with benman to perform remote load testing scripts.

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -h, --host <host>            Network interface to listen on. Default: 0.0.0.0
    -p, --port <port>            The port to listen on. Default: 9901
    -w, --workerNum <workerNum>  Number of local worker number. Default: 2
    
```

Once `benman-agent` is running, run test Collection in Command Line terminal using

```
benman --agent-url 0.0.0.0:9901 -p <name>.postman_collection.json
```


# Aggregators
Aggregators parse and report on results returned from the test run.

The default aggregator is `timeElapse`. Other aggregators can installed using NPM

```
/**
 * Time elapse aggregator will report following:
 * minTime  -- minimum time elapse for running the collection
 * maxTime -- maximum time elapse for running the collection
 * avgTime -- average time elpase for running the collection
 * timeArr -- array of all time elapsed
 * numberOfFailures -- count of request failures
 * numberOfRequests -- number of total requests made
 */
```

Example default output for a collection with 4 HTTP requests is:

```
[
  {
    "name": "benman",
    "timeElapse": {
      "minTime": 1522,
      "maxTime": 3300,
      "timeArr": [
        1568,
        1522,
        3192,
        3300,
        3270
      ],
      "avgTime": 2570.4,
      "numberOfFailures": 0,
      "numberOfRequests": 20
    }
  }
]
```

# Examples


In Postman, create basic HTTP requests.

![Alt text](./images/bGetReqParams.png?raw=true "HTTP request")

Create Postman Collection and add all the required HTTP requests.

### Export the Collection from Postman

![Alt text](./images/bCollectionSave.png?raw=true "Optional Title")


### Export as a Collection v2 file

![Alt text](./images/bCollectionExport.png?raw=true "Optional Title")

This will generate a Postman Collection config json file similar to:

```
{
	"variables": [],
	"info": {
		"name": "benman",
		"_postman_id": "6ba8a8bf-5c8f-56ec-a4e9-58c8a3a0c0d3",
		"description": "",
		"schema": "https://schema.getpostman.com/json/collection/v2.0.0/collection.json"
	},
	"item": [
		{
			"name": "get with params",
			"event": [
				{
					"listen": "test",
					"script": {
						"type": "text/javascript",
						"exec": [
							"",
							"tests[\"Status code is 200\"] = responseCode.code === 200;",
							"var jsonData = JSON.parse(responseBody);",
							"tests[\"name returned is Mary\"] = jsonData.msg === 'Hello Mary'",
							"",
							"tests[\"Response time is less than 200ms\"] = responseTime < 2000;",
							"",
							"var schema = {",
							" \"type\": \"object\",",
							" \"required\":[\"msg\"],",
							" \"properties\" : {",
							"        \"msg\" : { \"type\" : \"string\" } ",
							"    }",
							"};",
							"tests[\"Valid Data1\"] = tv4.validate(jsonData, schema);",
							"",
							""
						]
					}
				}
			],
			"request": {
				"url": "https://psdev-lpsrnkenozdzjvfx7xflazzl-evals-dev.mbaas1.tom.redhatmobile.com/hello?hello=Mary",
				"method": "GET",
				"header": [
					{
						"key": "Content-Type",
						"value": "application/json",
						"description": ""
					}
				],
				"body": {
					"mode": "raw",
					"raw": ""
				},
				"description": ""
			},
			"response": []
		}
	]
}
```


### Run Benman from command line using 

```
benman -p benman.postman_collection.json
```

### Example default output for a collection with 4 HTTP requests is:

```
[
  {
    "name": "benman",
    "timeElapse": {
      "minTime": 1522,
      "maxTime": 3300,
      "timeArr": [
        1568,
        1522,
        3192,
        3300,
        3270
      ],
      "avgTime": 2570.4,
      "numberOfFailures": 0,
      "numberOfRequests": 20
    }
  }
]
```


#License
MIT
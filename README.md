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

```js
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

#Agent

#Aggregators

#Examples

#License
MIT
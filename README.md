go-JIRA
=========

A nodejs module for retreiving and iterating over issues from a JIRA API. Requests to the API are performed asyncronously, but can be retreived in a first-in-first-out order by making use of the events it emits.

The name for this module a wordplay on the fact that the JIRA application is a truncation of the Japanese word for Godzilla, which is "Gojira".

## Requirements

JIRA API version 2

## Installation

npm install go-jira --save

## Settings

Settings must be passed as an object in order to configure the module. The options are as follow:

* protocal - http|https
* host - your.jirahost.com
* pathname - the path to the JIRA API
* auth - username:password (this will be changed to operate wih tokens, and perhaps to load from an untracked config file)
* project_id - The prefix for the primary project name. This does nothing right now, but will be used to allow passing issue ID number without the project ID - something I have found useful when working from the command line
* api_version - Does nothing at the moment. This is here to permit later abstraction should the JIRA API change. I've only worked with version 2 of the API.

Example:

	var settings = {
		protocol: 'https',
		host: jira.yourcompany.com,
		pathname: jira/rest/api/2,
		auth: username:password,
		project_id: TEST,
		api_version: 2
	}

	var jira = require('go-jira').config(settings);



### Methods

	Single Issue
	* .issue(issue_id)
	* .issue().get([property_key], [callback]);

	Multiple Issues
	* .issues(issue_ids);
	* .issues().get([property_key]);
	* .issues().each(callback)

### Issue Object Factory [jira.issue()]

Issue objects retreive, filter and store the response from the API for a single issue. To create an issue object, use the `.issue()` method, which is a factory that returns single issue objects based on a single ID that is passed. However, the issue method itself does not trigger the request, it simply prepares the object. To trigger the request use the 'get' method of the issue object.

For iterating over multiple issues, see the `.issues()` method.

## Params [jira.issue()]

	* issue_id [string] (required): ID for the desired JIRA issue

## Usage [jira.issue()]

	var issue_object = jira.issue(issue_id);

## Example [jira.issue()]

	var issue_object = jira.issue("PROJ-1234");

## Returns [jira.issue()]

	Method returns itself, allowing it to be chained.


### Fire Issue Request: jira.issue().get()

The .get() method fires and request to the API for the issue ID given to the issue factory. It allows filtering of the response object. The filtering is simply the normal json dot-notation for the path of the property. Upon completion, the issue will emit an event called 'response'.


## Params

	* property_key [string] (optional): The path to the property whos value should be passed to the callback. See examples, as as notation is non-obvious. If not given, the entire response object is passed to the callback. Can be an empty string. 
	* callback [function] (optional): What to do with the response object for the JIRA issue. Should have a single parameter, which is either the value of the property passed in the first parameter, or the entire response object if the property was empty.

## Usage

	issue_object.get([property_key], [callback]);

## Example

Property key must be given as the standard JSON dot notation, excluding the initial object and the first dot. 

If the entire object request object was such:
	
	var obj = {fruit: {apple: "red"}}
	console.log(obj.fruit.apple); // Says "red";

For the property notation passed to the `.get()` method, one would simply pass

	issue_object.get('fruit.apple', [callback]);

Just omit what would otherwise be the object itself, and the first dot. Note, that if no property key is passed, the entire `obj` response would be used.

The callback function should simply have one param, which will be filled with the value of the property key, or the entire object. 

	var property_key = 'fruit.apple';
	issue_object.get(property_key, function(response){
		console.log(response); // Given the object above, this would log "red".
	});

The callback is also optional, the same result can be acheived by listening to the `response` event which the `issue` object emits. Both methods are functionally equivelant, the redundency is for convienience.

	var property_key = 'fruit.apple';
	issue_object.get(property_key);

	issue.on('response', function(response){
		console.log(response); // Given the object above, this would log "red".
	});

### Issue Iteration [jira.issues()]

This is at its simplest, a wrapper of the standard `.issue()` object that allows for easy iteration. However, it also helps handle the multiple asychronous calls that might take place. The object emits a `response` event, once its received a response from each of the items requested. This allows you to iterate over the items in the same order as the ID's were given in the string.

This method excepts a single string of ID's that are comma delimited. When using the `.issues().get()` method, the module actually iterates over each issue and triggers the `issue().get()` method for each item, each time passing the arguments that were given. The callback is also triggered during each iteration, as is the normal response event for each individual issue. 

In order to have a callback function that is triggered after each individual issue is retreived, use the `issues().get().each(callback)`.

To trigger a callback which can interact with *all* the items after *all* of them have been fulfulled, use `.on('response', callback_function)`, the callback function needs to have a single parameter which contains an array of all the issues.













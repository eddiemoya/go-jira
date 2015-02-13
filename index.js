var goJIRA = function() {

    var EventEmitter = require("events").EventEmitter;
    var jio = this;

    this.config = function(options){
    	jio.options = options;
    }

    // Create a single IssueObject
    this.issue = function(resource_id) {
        return new IssueObject(resource_id);
    };

    // Create a MultiHandler object
    this.issues = function(resource_ids) {
        return new MultiHandler(resource_ids);
    }

    // Simple console.log wrapper for DI
    var StdConsole = function(){
        this.echo = function(output){
            console.log(output);
        }
    }

    // Wrapper object for the request module
    var RequestModule = function(){
        var request = require('request');

        this.get = function(options, callback){
            request.get(options, function(error, response, body){
	            callback(error, response, body);
	         });
        };

    };

    // Base Jira API Object - all requests should be made though extentions of this class.
    var JiraObject = function(){
 
        this.output = new StdConsole();
        this.request = new RequestModule();
        this.options = jio.options;
         
        this.parseURI = function(){
            var url = require('url');
            var options = jio.options;

            options.pathname = options.pathname.replace(/\/?$/, '/');

            return url.parse(url.format(options));
        }

        this.endpoint = function(){
            console.log(this.url.href + this.controller + this.resource_id)
            return this.url.href + this.controller + this.resource_id;
        }
    }

    var IssueObject = function(resource_id){
        var self = this;

        this.resource_id = resource_id;
        this.controller = 'issue/';
        this.url = this.parseURI();
 		
        this.get = function(property, callback){

            this.request.get(this.endpoint(), function(error, response, body){

            	if(!error && response.statusCode == 200){
	                self.body = self.parse(body);
	                self.response = self.value(property, self.body);
	                self.emit('response', self.value())

	                if(typeof callback === 'function' && typeof property !== 'undefined'){
	                    callback( self.value() );
	                }
            	} else {
            		//ENOTFOUND = Bad URL, null = bad resource, or bad password
            		if(error == "ENOTFOUND"){
            			console.log("ERROR: 400 Bad Request. JIRA Server likely inaccessible.")
            		}
            		console.log(error)
            	}
            });
            return self;
        }

        this.parse = function(object){

            var data = JSON.parse(object);

			//This is very specific to my purposes. Should be pulled out and into some sort of flexible, configurable mapping system
            data.shortnames = {
                priority:   data.fields.priority.name,
                id:         data.key, 
                summary:    data.fields.summary,
                assignee:   data.fields.assignee.displayName,
                git_branch: data.fields.customfield_14267
            };
   
            return data;
        }

        this.value = function(key, object){ 
            var response = object || this.response;

            if(typeof key !== 'undefined'){
                key.split('.').forEach(function(k){
                    response = response[k];
                });
            }

            return response;
        };
    };

    var MultiHandler = function(resource_ids){

        self = this;
        this.resource_ids = resource_ids.replace(/ /g,'').split(',');
        this.issues = issue_factory(this.resource_ids);

        function issue_factory(resource_ids) {
            objects = new Array();

            resource_ids.forEach(function(resource_id){
                objects.push(new IssueObject(resource_id));
             }); 

            return objects;
        }

        var check_completion = function(){

            var count = self.issues.length;
            var complete = 0;
            
            for(var c = count; c > 0; c--){
                if(typeof self.issues[c-1].response !== 'undefined' ) {
                    complete++; 
                } 

                if(complete == count){
                    self.emit('response', self)           
                } 
            }
        };

        this.get = function(property){

            this.each(function(issue, issue_id, obj){

                issue.get(property);

                issue.on('response', function(response){
                    // console.log(self.issues[issue_id].response);
                    check_completion();  
                });

            });

            return this;
        };

        this.each = function(callback){

            for(i in self.issues){
                if(typeof self.issues[i] !== 'function') {
                    callback(self.issues[i], i, self.issues)
                }
            }
        };
    };

    MultiHandler.prototype = Object.create(EventEmitter.prototype);
    JiraObject.prototype = Object.create(EventEmitter.prototype);
    IssueObject.prototype = new JiraObject();
};

module.exports = function() { return new goJIRA(); }()
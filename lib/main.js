// dependencies
var path = require("path"),
	fs = require("fs"),
	util = require('util'),
	onscribe = require("onscribe");

var Exec = function( program ){

	this.program = program;
	// setup configuration
	this.config();
	//
	this.api = onscribe;
}

Exec.prototype = {

	options: {

	},

	config: function(){
		var file = path.join(__dirname, "../", "config/path");
		// defaults
		var creds = {
		};

		if (this.program.config){
			var config_file = this.program.config;
			// open the config and save the new path
			var config = fs.openSync(file, "w");
			fs.writeSync(config, config_file, 0);

		} else {
			// load the config path
			var config_file = fs.readFileSync(file, "utf-8");
		}
		// either way load the config credentials
		if( !fs.existsSync(config_file) ){
			// create creds file
			fs.writeFileSync(config_file, JSON.stringify( creds ));
		} else {
			// load existing values
			creds = JSON.parse( fs.readFileSync(config_file, "utf-8") );
		}
		// save existing params
		if (this.program.key){
			creds.key = this.program.key;
		}
		if (this.program.secret){
			creds.secret = this.program.secret;
		}
		// save back to the file if we passed new values
		if (this.program.key || this.program.secret || this.program.app){
			fs.writeFileSync(config_file, JSON.stringify( creds ));
		}
		// save creds for later...
		this.creds = creds;
	},

	user : function( domain, options ){
		var onscribe = this.api.auth({key: this.creds.key ,secret: this.creds.secret, app: this.creds.app });

		if( options.list ){
			// read the user list instead

		}

	},

	sub : function( domain, options ){
		// fallbacks
		options = options || {};
		var onscribe = this.api.auth({keyid: this.creds.key ,secret: this.creds.secret, app: this.creds.app });

		if( domain == "*" ){
			// read the domain list instead
			return onscribe.list(function( error, result ) {
				if( error ) return console.log( error );
				output( result );
			});
		}
		var query = "";
		var fields = ( options.fields )? options.fields : "*";
		query += "select "+ fields +" from "+ domain;
		// add options
		if( options.query ){
			query += " where "+ options.query;
		}
		if( options.item ){
			query += " where itemName()='"+ options.item +"'";
		}
		if( options.order ){
			query += " order by "+ options.order;
		}
		if( options.limit ){
			query += " limit "+ options.limit;
		}
		onscribe.select( query, function( error, result ) {
			if( error ) return console.log( error );
			output( result );
		});

	}
}

// Helpers
function output( obj ){
	return console.log(JSON.stringify(obj));
	//return console.log( util.inspect(obj, false, null) );
}

module.exports = function( program ){

	return new Exec( program );

}
// dependencies
var _ = require("underscore"),
	defaults = require("../config/default"),
	fs = require("fs"),
	path = require("path"),
	prompt = require('prompt'),
	Onscribe = require("onscribe"),
	util = require('util');

var Exec = function( program ){

	this.program = program;

	// change the config file path
	if (this.program.config) this.updatePath( this.program.config );

	// setup configuration
	this.config = this.initConfig();

	// init lib
	this.api = new Onscribe( this.config );

}

Exec.prototype = {

	// containers
	config: {},

	setup: function( options ){
		// variables
		var self = this,
			config = {},
			keys = ['email', 'token'];

		// extended setup
		if( options.all ) keys.push('key', 'secret', 'url');

		// Start the prompt
		prompt.start();
		//
		// Get two properties from the user: email and token
		prompt.get(keys, function (err, response) {
			//
			// Log the results
			for( var i in response ){
				// update only keys we need...
				if( keys.indexOf(i) > -1 ) config[i] = response[i];
			}
			// save config back to the file
			self.saveConfig( config );
			return console.log('Setup complete.');
		});
	},

	initConfig: function(){
		// variables
		var config = {},
			custom = {};
		// get existing setup
		var file = getConfig();
		if( !fs.existsSync(file) ){
			// create creds file
			fs.writeFileSync(file, JSON.stringify( config ));
		} else {
			// load existing values
			custom = JSON.parse( fs.readFileSync(file, "utf-8") );
		}
		// extend defaults
		config = _.extend({}, defaults, custom);

		return config;

/*
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
*/
	},

	initAuth: function( callback ){
		callback = callback || function(){};
		// check existing token
		if( this.config.auth ){
			var now = (new Date()).getTime();
			var hour = 3600000;
			if( this.config.auth.expires > now + hour ) return callback();
		}
		// get new token
		this.getToken( callback );

	},

	//
	get: function( params ){
		var self = this;
		// use async module?
		// get token
		this.initAuth(function(){
			// add token to the
			params.token = self.config.creds.access_token || false;
			if( !params.token ) return output("No valid token"); // re-initialize?
			// then ask for specific data
			self.api.read( params, function(err, result){
				if( err ) return output( err );
				//output data
				output( result );
			});
		});

	},

	// API

	user: function( domain, options ){
		var onscribe = this.api.auth({key: this.config.key ,secret: this.config.secret, app: this.config.app });
		/*
		var params = {
			name: path[0],
			id: path[1] || false,
			type: path[3] || false,
			token: token
		}
		*/
	//
		if( options.list ){
			// not available

		}

	},

	product: function( domain, options ){
		var params = {};

		if( options.all ){
			// read the product collection for the current user: /products
			params.name = "products";
		}
		this.get( params );
	},

	provider: function( domain, options ){
		var onscribe = this.api.auth({key: this.config.key ,secret: this.config.secret, app: this.config.app });

		if( options.list ){
			// read the user list instead

		}

	},

	subscription: function( domain, options ){
		// fallbacks
		options = options || {};
		var onscribe = this.api.auth({keyid: this.config.key ,secret: this.config.secret, app: this.config.app });

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

	},

	saveConfig: function ( config ){
		// load existing values
		var file = getConfig();
		var input = JSON.parse( fs.readFileSync(file, "utf-8") );
		var output = _.extend({}, input, config);
		// save file
		fs.writeFileSync(file, JSON.stringify(output), 0);
		// update loaded config
		this.config = _.extend({}, this.config, config);
	},

	updatePath: function ( config ){
		// get path location
		var file = path.resolve( __dirname, '../config/path');
		// save file
		fs.writeFileSync(file, config, 0);
	},

	getToken: function( callback ){
		var self = this;
		this.api.password({ username: this.config.email, password: this.config.token }, function( err, result ){
			if( err ) return console.log("Error authenticating", err);
			console.log("resultresult", result);
			// normalize expiry
			if( result.expires_in ){
				var now = (new Date()).getTime();
				result.expires = now + result.expires_in;
			}
			// save token
			self.saveConfig({ creds: result });
			callback();
		});
	}
}

// Helpers
function output( obj ){
	return console.log(JSON.stringify(obj));
	//return console.log( util.inspect(obj, false, null) );
}

function homeDir() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function getConfig(){
	var config = path.join(__dirname, "../", "config/path");
	// load the config file
	var file = fs.readFileSync(config, "utf-8");
	var home = homeDir( file );
	// FIX : replace home dir
	file = file.replace("~", home);
	return file;
}


module.exports = function( program ){

	return new Exec( program );

}
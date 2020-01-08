'use strict';

/* Magic Mirror
 * Module: MMM-VigilanceMeteoFrance
 *
 * Magic Mirror By Michael Teeuw https://magicmirror.builders
 * MIT Licensed.
 *
 * Module MMM-ToDo By Grena https://github.com/grenagit
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const ical = require('ical');

module.exports = NodeHelper.create({

	getData: function() {
		var self = this;

		nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
		var opts = {
			headers: {
				"User-Agent": "Mozilla/5.0 (Node.js "+ nodeVersion + ") MagicMirror/"  + global.version +  " (https://github.com/MichMich/MagicMirror/)"
			},
			gzip: true
		};

		if (self.config.calendar.auth) {
			if(self.config.calendar.auth.method === "bearer"){
				opts.auth = {
					bearer: self.config.calendar.auth.pass
				};

			} else {
				opts.auth = {
					user: self.config.calendar.auth.user,
					pass: self.config.calendar.auth.pass
				};

				if(self.config.calendar.auth.method === "digest"){
					opts.auth.sendImmediately = false;
				} else {
					opts.auth.sendImmediately = true;
				}
			}
		}

		ical.fromURL(self.config.calendar.url, opts, function(err, data) {
			let tasks = [];

			for (let k in data) {
				if (data.hasOwnProperty(k)) {
					if (data[k].type == 'VTODO') {
						//tasks.push({"data": data[k]});
						tasks.push({"title": data[k].summary, "status": data[k].status, "completion": parseInt(data[k].completion), "priority": (data[k].priority > 0 ? parseInt(data[k].priority) : 0), "created": data[k].created, "start": data[k].start, "due": data[k].due});
						if(!self.config.showTaskCompleted && data[k].status == 'COMPLETED') {
							tasks.pop();
						}
					}
				}
			}

			self.sendSocketNotification("DATA", JSON.stringify(tasks));
		});

	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;
		if (notification === 'CONFIG') {
			self.config = payload;
			self.sendSocketNotification("STARTED", true);
			self.getData();
		}
	}

});


#<a name="top"></a>Custom Http PEP proxy for Cosmos

* [What is frb-cosmos-proxy](#whatis)
* [Installation](#maininstall)
    * [Prerequisites](#prerequisites)
    * [Installation](#installation)
    * [Unit tests](#unittests)
* [Configuration](#configuration)
* [Running](#running)
* [Administration](#administration)
* [Usage](#usage)
* [Reporting issues and contact information](#contact)

##<a name="whatis"></a>What is frb-cosmos-proxy
frb-cosmos-proxy is a custom Http proxy acting as a Policy Enorcement Point (PEP). This means:

* frb-cosmos-proxy is deployed before any Cosmos Http service aimed to be protected.
* frb-cosmos-proxy is designed to authenticate and authorize the requests origianlly sent to the Cosmos Http service.

Authentication and authorization are based on [OAuth2](http://oauth.net/2/) tokens generated by any trusted third party (TTP; in the case of FIWARE, this is the [Keyrock Identity Manager](http://catalogue.fiware.org/enablers/identity-management-keyrock)) that must be attached to the Http requests as `X-Auth-Token` headers. Once received:

1. The token is used to get the user ID from the TTP.
2. The ID is checked against the Cosmos ID within the resource aimed to be used (any Cosmos resource is a URI containing the HDFS user space which is based in the TTP ID).
3. If matching both TTP and Cosmos IDs then the user is authorized to use the Cosmos resource.

[Top](#top)

##<a name="maininstall"></a>Installation
This is a software written in JavaScript, specifically suited for [Node.js](https://nodejs.org) (<i>JavaScript on the server side</i>). JavaScript is an interpreted programming language thus it is not necessary to compile it nor build any package; having the source code downloaded somewhere in your machine is enough.

###<a name="prerequisites"></a>Prerequisites
This PER proxy has no sense if an Identity Manager (Keyrock implementation can be found [here](http://catalogue.fiware.org/enablers/identity-management-keyrock)) is not installed. The same applies to [Cosmos](http://catalogue.fiware.org/enablers/bigdata-analysis-cosmos).

As said, frb-cosmos-proxy is a Node.js application, therefore install it from the official [download](https://nodejs.org/download/). An advanced alternative is to install [Node Version Manager](https://github.com/creationix/nvm) (nvm) by creationix/Tim Caswell, whcih will allow you to have several versions of Node.js and switch among them.

Of course, common tools such as `git` and `curl` may be needed.

[Top](#top)

###<a name="installation"></a>Installation
Start by creating, if not yet created, a Unix user named `cosmos-proxy`; it is needed for installing and running the application. You can only do this as root, or as another sudoer user:

    $ sudo useradd cosmos-proxy
    $ sudo passwd cosmos-proxy <choose_a_password>
    
While you are a sudoer user, create a folder for saving the cosmos-proxy log traces under a path of your choice, typically `/var/log/cosmos/cosmos-proxy`, and set `cosmos-proxy` as the owner:

    $ sudo mkdir -p /var/log/cosmos/cosmos-proxy
    $ sudo chown cosmos-proxy:cosmos-proxy /var/log/cosmos/cosmos-proxy

Now, change to the new fresh `cosmos-proxy` user:

    $ su - cosmos-proxy

Then, clone the Cosmos repository somewhere of your ownership:

    $ git clone https://github.com/frbattid/frb-cosmos-proxy.git
    
Change to the `frb-cosmos-proxy` directory and execute the installation command:

    $ cd frb-cosmos-proxy
    $ npm install
    
That must download all the dependencies under a `node_modules` directory.

[Top](#top)

###<a name="unittests"></a>Unit tests
To be done.

[Top](#top)

##<a name="configuration"></a>Configuration
frb-cosmos-proxy is configured through a JSON file. These are the available parameters:

* **host**: FQDN or IP address of the host running the proxy.
* **port**: TCP listening port for incomming proxied requests.
* **target**:
    * **host**: FQDN or IP address of the host running the real service.
    * **port**: TCP listening port of the real service.
* **idm**:
    * **host**: FQDN or IP address where the Identity Manager runs. Do not write it in URL form!
    * **port**: Port where the Identity Manager listens for requests. Typically 443.
* **log**:
    * **file_name**: path of the file where the log traces will be saved in a daily rotation basis. This file must be within the logging folder owned by the the user `cosmos-auth`.
    * **date_pattern**: data pattern to be appended to the log file name when the log file is rotated.

[Top](#top)

##<a name="running"></a>Running
The PEP proxy implemented by frb-cosmos-proxy is run as (assuming your current directory is `frb-cosmos-proxy`):

    $ npm start
    
If everything goes well, you should be able to see in the logs at `/var/log/cosmos/cosmos-proxy`:

    {"level":"info","message":"Starting cosmos-proxy in 0.0.0.0:14000","timestamp":"2016-07-14T11:48:10.968Z"}
    
[Top](#top)

##<a name="usage"></a>Usage
Use frb-cosmos-proxy to protect any Cosmos Http based resource.

For instance, if aiming to protect WebHDFS simply re-configure the service for running in an alternative port different than the default one, e.g. TCP/41000 instead or TCP/14000. Then, configure the proxy for listening in the original WebHDFS port, i.e. TCP/14000 and specify the new target port, i.e. TCP/41000. From here on, all the requests sent to the WebHDFS service will be really sent to the proxy, attaching the required `X-Auth-Token` for authenitcation and authorization purposes:

    $ curl -X GET "http://storage.cosmos.lab.fiware.org:14000/webhdfs/v1/user/frb?op=liststatus&user.name=frb" -H "X-Auth-Token: mytoken"
    "FileStatuses":{"FileStatus":[{"pathSuffix":".Trash","type":"DIRECTORY","length":0,"owner":"frb","group":"frb","permission":"700","accessTime":0,"modificationTime":1468519200094,"blockSize":0,"replication":0},{"pathSuffix":...

You may have a look on the proxy and see how authentication and authorization has been done:

    {"level":"info","message":"Authentication OK: {\"organizations\": [], \"displayName\": \"frb\", \"roles\": [{\"name\": \"provider\", \"id\": \"106\"}], \"app_id\": \"4d1af2eec3754099a4f8dc86bf735068\", \"email\": \"frb@tid.es\", \"id\": \"frb\"}","timestamp":"2016-07-14T11:48:15.332Z"}
    {"level":"info","message":"Authorization OK: user frb is allowed to access /webhdfs/v1/user/frb","timestamp":"2016-07-14T11:48:15.332Z"}
    {"level":"info","message":"Redirecting to http://0.0.0.0:41000","timestamp":"2016-07-14T11:48:15.332Z"} 
 
[Top](#top)

##<a name="administration"></a>Administration
Within frb-cosmos-proxy there is a single source of information useful for administrating it: the logs.

Logging traces are typically saved under `/var/log/cosmos/cosmos-proxy`. These traces are written in JSON format, having the following fields: level, message and timestamp. For instance:

    {"level":"info","message":"Starting cosmos-proxy in 0.0.0.0:14000","timestamp":"2016-07-14T11:48:10.968Z"}

Logging levels follow this hierarchy:

    debug < info < warn < error < fatal
    
Within the log it is expected to find many `info` messages, and a few of `warn` or `error` types. Of special interest are the errors:

* ***Authentication error***: The user could not be authenticated either because the token is not valid, either because the communication with the Keyrock Identity Manager is down.
* ***Authorization error***: The user could not be authorized or using the requested Cosmos resource: his/her ID did not match the Cosmos ID in the resource.

[Top](#top)

##<a name="contact"></a>Reporting issues and contact information
There are several channels suited for reporting issues and asking for doubts in general. Each one depends on the nature of the question:

* Use [stackoverflow.com](http://stackoverflow.com) for specific questions about the software. Typically, these will be related to installation problems, errors and bugs. Development questions when forking the code are welcome as well. Use the `fiware-cosmos` tag.
* Use [fiware-tech-help@lists.fi-ware.org](mailto:fiware-tech-help@lists.fi-ware.org) for general questions about the software. Typically, these will be related to the conceptual usage of the component, e.g. wether it suites for your project or not. It is worth to mention the issues reported to [fiware-tech-help@lists.fi-ware.org](mailto:fiware-tech-help@lists.fi-ware.org) are tracked under [http://jira.fiware.org](http://jira.fiware.org); use this Jira to see the status of the issue, who has been assigneed to, the exchanged emails, etc, nevertheless the answers will be sent to you via email too.
* Personal email:
    * [francisco.romerobueno@telefonica.com](mailto:francisco.romerobueno@telefonica.com) **[Main contributor]**
    * [pablo.coellovillalba@telefonica.com](mailto:pablo.coellovillalba@telefonica.com) **[Contributor]**

**NOTE**: Please try to avoid personaly emailing the contributors unless they ask for it. In fact, if you send a private email you will probably receive an automatic response enforcing you to use [stackoverflow.com](stackoverflow.com) or [fiware-tech-help@lists.fi-ware.org](mailto:fiware-tech-help@lists.fi-ware.org). This is because using the mentioned methods will create a public database of knowledge that can be useful for future users; private email is just private and cannot be shared.

[Top](#top)

So, we are using Effect TS, so we are going to use a ton of types through out the whole application. I quickly realized that this was an issue when I had to have a db error that is coming from the db package initially, but it has to be defined in a Service in another package, like we have to define it together with the actual typed error. If the error is defined in the db package we have to import the db package everywhere, we of course do not want to do that. So we should define all of these things in the domains package. This includes the RPC routes because that will be imported in both the backend and the frontend, and might even get imported later somewhere else.

So there is alot that will be defined in domains. What I have to figure out is how I want to define stuff, or rather, structure stuff.

So for database, its actually quite simple, we just keep it to one file as its just one error.

For other stuff, such as RPC, Chat and others it will get a bit more messy. I'm currently thinking that we might want to keep errors in one file and RPC definition in another, like we do now, but I am also thinking that this might be premature optimization as files might not get too big? Its my first effect project so I am not sure.

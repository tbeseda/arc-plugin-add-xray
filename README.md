# AWS "X-Ray Tracing" for Lambdas deployed with [Architect](https://arc.codes)

## Usage

```sh
npm i -D arc-plugin-add-xray
```

```sh
# ... in your app.arc

@aws
policies
  AWSXRayDaemonWriteAccess # specific policy for X-Ray is REQUIRED!
  architect-default-policies # restore Arc's least-privilege permissions

@plugins
arc-plugin-add-xray # enable "add-xray"

@add-xray
environments production # specify environments. defaults to both: "staging production"
scheduled # add Tracing to all @scheduled functions, can be any lambda pragma
events foo-bar # add Tracing to a specific event
http get /messages # add Tracing to a specific @http function
http post /messages # the http method (post in this case) is always required
```

Note: providing no options or just `environments` will add X-Ray to ALL Lambda functions

## Resources

[Lambda X-Ray Tracing Docs](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html)

[X-Ray Pricing](https://aws.amazon.com/xray/pricing/) -- X-Ray Tracers beware: it's not free, but it is cheap.


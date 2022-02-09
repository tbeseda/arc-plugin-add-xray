# arc-plugin-add-xray

> AWS _"X-Ray Tracing"_ for Lambdas deployed with [Architect](https://arc.codes).

## Usage

```sh
npm i -D arc-plugin-add-xray
```

```sh
# ... in your app.arc

@plugins
arc-plugin-add-xray # enable "add-xray"

@xray
environments staging production # defaults to both staging
http # add to all @http functions
scheduled # can be any Lambda pragma
```

To enable _X-Ray Tracing_ in individual functions add `xray true` to a function's `config.arc`:

```sh
# ./src/events/foobar

@aws
xray true
```

> ℹ️  To enable _X-Ray Tracing_ for ALL Lambda functions, do not set a pragma in `app.arc`'s `@xray` or set `xray true` in a `config.arc`.  
> `environments` can be still be set under `@xray` in `app.arc`.

## Resources

[Lambda X-Ray Tracing Docs](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html)

[X-Ray Pricing](https://aws.amazon.com/xray/pricing/) -- X-Ray Tracers beware: it's not free, but it is cheap.


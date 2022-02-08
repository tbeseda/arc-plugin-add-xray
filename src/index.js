const MY_NAME = 'add-xray'

function log (msg, ...rest) {
  console.log(`<@${MY_NAME}>: ${msg}`, ...rest)
}

module.exports = {
  deploy: {
    start: async (params) => {
      const {
        arc,
        cloudformation,
        inventory: { inv },
        stage,
      } = params
      const lambdaTypes = inv._arc.pragmas.lambdas

      const config = arc[MY_NAME]

      if (config) {
        const settings = {
          environments: [ 'staging', 'production' ],
          wholePragmas: [],
          specificLambdas: [],
        }

        // parse options and create settings
        for (const option of config) {
          if (Array.isArray(option)) {
            const first = option[0]
            const rest = [ ...option.slice(1) ]

            if (first === 'environments') {
              settings.environments = rest
            }
            else if (lambdaTypes.includes(first)) {
              settings.specificLambdas.push({
                type: first,
                name: rest.join(' '),
              })
            }
            else {
              log('invalid config:', option)
            }
          }
          else if (typeof option === 'string') {
            if (lambdaTypes.includes(option)) {
              settings.wholePragmas.push(option)
            }
          }
          else {
            log('invalid config:', option)
          }
        }

        // log('settings', settings);

        if (!settings.environments.includes(stage)) {
          log(`"${stage}" environment not included in configuration.`)
          return
        }

        const codePaths = []
        if (settings.wholePragmas.length || settings.specificLambdas.length) {
          for (const pragma of settings.wholePragmas) {
            if (inv[pragma]) {
              for (const fn of inv[pragma]) {
                codePaths.push(fn.src)
              }
            }
            else {
              log(`no functions for pragma "@${pragma}"`)
            }
          }
          // and mapping specificLambdas entries to inv type by name
          for (const lambda of settings.specificLambdas) {
            if (inv[lambda.type]) {
              const found = inv[lambda.type].find((fn) => fn.name === lambda.name)
              if (found) {
                codePaths.push(found.src)
              }
              else {
                log(`unable to find function for`, lambda)
              }
            }
          }
        }

        // log('paths', codePaths);

        const cfLambdaNames = Object.keys(cloudformation.Resources).filter((name) => {
          return cloudformation.Resources[name].Type === 'AWS::Serverless::Function'
        })

        if (codePaths) {
          let count = 0
          for (const path of codePaths) {
            let matched = false

            for (const name of cfLambdaNames) {
              if (cloudformation.Resources[name].Properties.CodeUri === path) {
                cloudformation.Resources[name].Properties.Tracing = 'Active'
                matched = true
                count++
              }
            }

            if (!matched) {
              log(`CloudFormation for ${path} not found`)
            }
          }

          log(`Added X-Ray tracing to ${count} functions.`)
        }
        else {
          for (const name of cfLambdaNames) {
            cloudformation.Resources[name].Properties.Tracing = 'Active'
          }

          log(`Added X-Ray tracing to ${cfLambdaNames.length} functions.`)
        }

        return cloudformation
      }
      else {
        log(`"${MY_NAME}" is installed but not configured. X-Ray tracing not added.`)
        log(`Add "@${MY_NAME}" with options to your app.arc.`)
      }
    },
  },
}

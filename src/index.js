const MY_NAME = 'xray'

function log (msg, ...rest) {
  console.log(`<@${MY_NAME}>: ${msg}`, ...rest)
}

module.exports = {
  deploy: {
    start: async (params) => {
      const { arc, cloudformation, inventory, stage } = params
      const { inv } = inventory
      const lambdaTypes = inv._arc.pragmas.lambdas

      const config = arc[MY_NAME]

      if (config) {
        let defaultStages = [ 'staging' ]
        const configuredPragmas = []

        // parse project manifest @xray options
        for (const option of config) {
          if (Array.isArray(option)) {
            if (option[0] === 'environments') {
              defaultStages = [ ...option.slice(1) ]
            }
            else {
              log('invalid config:', option)
            }
          }
          else if (typeof option === 'string') {
            if (lambdaTypes.includes(option)) {
              configuredPragmas.push(option)
            }
            else {
              log('invalid pragma:', option)
            }
          }
          else {
            log('invalid config:', option)
          }
        }

        if (!defaultStages.includes(stage)) {
          log(`"${stage}" environment not included in configuration.`)
          return
        }

        const codePaths = []

        // look for config.arc xray settings
        for (const path in inv.lambdasBySrcDir) {
          const fn = inv.lambdasBySrcDir[path]
          if (fn.config?.xray) {
            codePaths.push(path)
          }
        }

        // collect configured pragma's lambda src dirs
        for (const pragma of configuredPragmas) {
          if (inv[pragma]) {
            for (const fn of inv[pragma]) {
              codePaths.push(fn.build || fn.src)
            }
          }
          else {
            log(`no functions for pragma "@${pragma}"`)
          }
        }

        const cfLambdaNames = Object.keys(cloudformation.Resources).filter((name) => {
          return cloudformation.Resources[name].Type === 'AWS::Serverless::Function'
        })

        if (codePaths.length > 0) {
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
          if (count !== codePaths.length) {
            log(`Expected to add to ${codePaths.length} functions!`)
          }
        }
        else {
          // add X-Ray to all functions
          for (const name of cfLambdaNames) {
            cloudformation.Resources[name].Properties.Tracing = 'Active'
          }

          log(`Added X-Ray tracing to ${cfLambdaNames.length} functions.`)
        }

        // add recommended X-Ray policy
        // https://docs.aws.amazon.com/xray/latest/devguide/security_iam_id-based-policy-examples.html#xray-permissions-managedpolicies
        cloudformation.Resources.Role.Properties.Policies.push({
          PolicyName: 'ArcXrayPolicy',
          PolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'xray:PutTraceSegments',
                  'xray:PutTelemetryRecords',
                  'xray:GetSamplingRules',
                  'xray:GetSamplingTargets',
                  'xray:GetSamplingStatisticSummaries',
                ],
                Resource: [ '*' ],
              },
            ],
          },
        })

        // alternatively, add arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
        // to each Resources[function].Properties.ManagedPolicyArns[]

        return cloudformation
      }
      else {
        log(`"${MY_NAME}" is installed but not configured. X-Ray tracing not added.`)
        log(`Add "@${MY_NAME}" with options to your app.arc.`)
      }
    },
  },
}

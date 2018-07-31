#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const VERSION = 'Electron desktop \nversion ' + require('./package').version
const chalk = require('chalk')
const { spawn } = require('child_process')
const fs = require('fs')
const ora = require('ora')
const gitDownload = require('download-git-repo')
const inquirer = require('inquirer')

program.version(chalk.green(VERSION),'-v, --version')

const Errors = {
    TypeError:new Error('Type is vue or react')
}

program
    .command('init <type> <project-name>')
    .description('generate a new project from a template')
    .action(function(type, name){
        let spinner = ora('Loading download template').start();
        let package;
        const appPath = path.resolve(name)
        if(!/(vue|react)/.test(type)) throw Errors.TypeError
        function download(type,dest){
            gitDownload(`ranyunlong/electron-desktop#${type}`,dest,async function(err){
                if(err){
                    spinner.fail('Template download failed!')
                    throw err;
                }
                spinner.succeed('Temlate download succeed!')
                package = JSON.parse(fs.readFileSync(path.join(dest,'package.json')).toString())
                const packageName =  await inquirer.prompt({
                    type:'input',
                    name:'data',
                    message:"Package name:",
                    default:name
                })
                const author = await inquirer.prompt({
                    type:'input',
                    name:'data',
                    message:"Author:"
                })
                const version = await inquirer.prompt({
                    type:'input',
                    name:'data',
                    message:"Version:",
                    default:'0.0.0'
                })

                const productName = await inquirer.prompt({
                    type:'input',
                    name:'data',
                    message:"ProductName:",
                    default:name
                })

                package.build.productName = productName.data
                package.author = author.data
                package.version = version.data
                package.name = packageName.data
                package.build.appId = `org.${name}.app`
                fs.writeFileSync(path.join(dest,'package.json'),JSON.stringify(package,null,2))
                const chooseInstall = await inquirer.prompt({
                    type:'list',
                    name:'data',
                    message:"Choose what way to install?",
                    default:0,
                    choices:['yarn','npm'],
                })

                let type = chooseInstall.data;
                if(process.platform == 'win32') type += '.cmd'

                const install =  spawn(type,['install'],{
                    cwd:path.resolve(name),
                    stdio:'inherit',
                    env:process.env
                }) 

                install.on('close',function(){
                    console.log('\nTo get started:\n')
                    console.log(chalk.yellow(`cd ${name}`))
                    console.log(chalk.yellow(`${type.replace('.cmd','')} run dev`))     
                    console.log(chalk.yellow(`docs in ${chalk.green(`https://github.com/ranyunlong/electron-desktop`)}`))
                })

            })
        }
        if(fs.existsSync(appPath)){
            spinner.stop()
            inquirer.prompt({
                type:'confirm',
                name:'download',
                message:"Has the project already existed to continue to be created?",
                default:true
            }).then(res=>{
                if(res.download){
                    spinner = ora('Loading download template').start();
                    download(type,appPath)
                }
            })
        }else{
            download(type,appPath)
        }
    })

program.parse(process.argv)

if(process.argv.length <= 2){
    program.outputHelp(cb=>{
        return chalk.green(cb)
    })
}

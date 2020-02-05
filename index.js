/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {

  const CONFIG_REPOSITORY = '.github'

  app.on('push', sync)

  async function sync (context) {
    console.log(context.payload)
   
    if (context.payload.repository.name !== CONFIG_REPOSITORY){
      console.log(`Ignoring repository ${context.payload.repository.name}`)
      return;
    }

    // TODO get from some config
    const repos = ['chipmunk-web']

    repos.forEach( async (repo) => {
      const owner = context.payload.repository.owner.name
      console.log("Processing " + owner + "/" + repo) 
  
      // test
      const branch = `sync-microlith-config`
  
      console.log("Getting ref") 
  
      // Get current reference in Git
      const reference = await context.github.git.getRef({
        repo, // the repo
        owner, // the owner of the repo
        ref: 'heads/master'
      })
      console.log(reference)
  
  
      console.log("Checking if branch exists") 
      // Get current reference in Git
      try {
        await context.github.git.getRef({
          repo, // the repo
          owner, // the owner of the repo
          ref: `heads/${branch}`
        })
      } catch (error){
        console.log(error)
        console.log("Creating branch") 
        // Create a branch
        await context.github.git.createRef({
          repo,
          owner,
          ref: `refs/heads/${branch}`,
          sha: reference.data.object.sha // accesses the sha from the heads/master reference we got
        })
      }
  
      // create tree
      console.log("Creating tree") 
      const tree = await context.github.git.createTree({
        repo,
        owner,
        tree: [
          {
            path: "hello.md",
            content: Buffer.from('My new file is awesome!').toString('base64'),
          }
        ],
        base_tree: reference.data.object.shareference.data.object.sha
      })
      // create commit
      // update ref (force)
      console.log(tree)

      await context.github.git.createCommit({
        repo,
        owner,
        tree: tree.data.sha,
        message: 'adds config file', // a commit message
        force: true,
        branch // the branch name we used when creating a Git reference
      })

      console.log("Creating file") 
  
      // create a PR from that branch with the commit of our added file
      await context.github.pulls.create({
        repo,
        owner,
        title: 'Adding my file!', // the title of the PR
        head: branch, // the branch our chances are on
        base: 'master', // the branch to which you want to merge your changes
        body: 'Adds my new file!', // the body of your PR,
        maintainer_can_modify: true // allows maintainers to edit your app's PR
      })
        
    })
        
  }


}

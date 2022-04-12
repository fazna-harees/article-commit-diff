const path = require("path");
const fs = require("fs");
const axios = require('axios');

const dirPath = path.join(__dirname, "./articles");

require('dotenv').config()
const { BACKEND_API, BRANCH, API_KEY, ORGANIZATION, REPO } = process.env;

const removeLineBreaks = (str) => {
    var newstr = "";
    for( var i = 0; i < str.length; i++ ) 
        if( !(str[i] == '\n' || str[i] == '\r') )
            newstr += str[i];
    return newstr;
}
const getPost = async(slug) => {
    const res = await axios.get(`${BACKEND_API}blog/slug/${slug}`);
    return res;
}   
const checkIfPostexist = async(slug) => {
    try{
        const res = await getPost(slug)
        console.log("POST EXIST",slug)
        if(res?.data){
            return true;
        }
        return false
    }catch(err) {
        console.log("SLUG ERROR",err)
    }
}

const updatePost = async(post) => {
    try{
        const { data } = await getPost(post.slug)
        console.log(data)
        await axios.post(`${BACKEND_API}blog/update/${data._id}`,post,{
            headers: {
                "Authorization": `Api-key ${API_KEY}`
            }
        })
        console.log("UPDATED",post.slug)
    }catch(err) {
        console.log("UPDATE ERROR",err)
    }
}

const createPost = async(post) => {
    try{
        await axios.post(`${BACKEND_API}blog/add`,post)
        console.log("CREATED",post.slug)

    }catch(err) {
        console.log("CREATE ERROR",err)
    }
}

const forEachPost = async(file) => {
    const obj = {};
      let post;
      fs.readFile(`${dirPath}/${file}`, "utf8", async(err, contents) => {
        const getMetadataIndices = (acc, elem, index) => {
          if (/^---/.test(elem)) {
            acc.push(index);
          }
          console.log(err)
          return acc;
        };
        
        const parseMetadata = ({ lines , metadataIndices }) => {
          if (metadataIndices.length > 0) {
            const metadata = lines.slice(metadataIndices[0] + 1, metadataIndices[1]);
            metadata.forEach((line) => {
              // eslint-disable-next-line prefer-destructuring
              obj[line.split(": ")[0]] = removeLineBreaks(line.split(": ")[1])
              console.log(obj[line.split(": ")[0]])

            });
            return obj;
          }
        };

        const parseContent = ({ lines, metadataIndices }) => {
          let newLines = lines;
          if (metadataIndices.length > 0) {
            newLines = lines.slice(metadataIndices[1] + 1, lines.length);
          }
          return newLines.join("\n");
        };

        const lines = contents.split("\n");
        const metadataIndices = lines.reduce(getMetadataIndices, []);
        const metadata = parseMetadata({ lines, metadataIndices });
        const content = parseContent({ lines, metadataIndices });

        post = {
          title: metadata.title ? metadata.title : "No title given",
          author: metadata.author ? metadata.author : "No author given",
          description: metadata.description || "No date given",
          category: metadata.category || "NULL",
          slug: metadata.slug || "error",
          subcategory: metadata.subcategory || "NULL",
          content: content || "No content given",
        };
        console.log(post)
        try{
        if(post.slug){
            const doesExist = await checkIfPostexist(post.slug)
            if(doesExist) {
                await updatePost(post)
            }else{
                await createPost(post)
            }
        }
        }catch(err) {
            console.log(err)
        }
      });
}

const getlastName = ( path) => {
    const arr = path.split('/')
    return arr[arr.length -1]
}

const getSecondLast = (path) => {
    const arr = path.split('/')
    return arr[arr.length -2]
}

const checkIfMdFile = ( file ) => {
    const last = file.slice(-2)
    if(last === "md"){
        return true
    }
    return false;
}
const getCommits = async() => {
    const {data:commits} = await axios.get(`https://api.github.com/repos/${ORGANIZATION}/${REPO}/commits/${BRANCH}`)
    if(commits.files){
        commits.files.forEach(async(i) => {
            const article = getSecondLast(i.filename)
            const file = getlastName(i.filename)
            if(checkIfMdFile(file) && article==="articles" && i.status!=="removed"){
                console.log("FILE",file)
                await forEachPost(file)
            }
        })
    }
}

getCommits()
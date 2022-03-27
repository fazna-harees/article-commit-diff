/* eslint-disable consistent-return */
const path = require("path");
const fs = require("fs");
const axios = require('axios');

const dirPath = path.join(__dirname, "./articles");
const postlist = [];

const getPost = async(slug) => {
    const res = await axios.get(`https://localhost:4000/slug/${slug}`);
    return res.data
}   
const checkIfPostexist = async(slug) => {
    const res = await getPost(slug)
    console.log("SLUG",res)
    if(res){
        return true;
    }
    return false
}

const updatePost = async(post) => {
    const { data } = await getPost(post.slug)
    await axios.post(`https://localhost:4000/update/${data.id}`,{data:post})
}

const createPost = async(post) => {
    const { data } = await axios.post(`https://localhost:4000/add`,{data:post})
}

const forEachPost = async(file) => {
    const obj = {};
      let post;
      // eslint-disable-next-line @typescript-eslint/no-shadow
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
              obj[line.split(": ")[0]] = line.split(": ")[1].slice(0,-1);
            });
            console.log(obj);
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

        // postlist.push(post);
        const doesExist = await checkIfPostexist(post.slug)
        if(doesExist) {
            await updatePost(post)
        }else{
            await createPost(post)
        }
      });
}
const getPosts = () => {
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return console.log(`failed${err}`);
    }
    files.forEach((file, i) => {
    forEachPost(file,i)
    });
  });
};

// getPosts();

const getlastName = ( path) => {
    const arr = path.split('/')
    return arr[arr.length -1]
}

const checkIfMdFile = ( file ) => {
    const last = file.slice(-2)
    if(last === "md"){
        return true
    }
    return false;
}
const getCommits = async() => {
    const {data:commits} = await axios.get('https://api.github.com/repos/fazna-harees/article-commit-diff/commits/feat/new')
    if(commits.files){
        commits.files.forEach(i => {
            const file = getlastName(i.filename)
            if(checkIfMdFile(file)){
                getPosts(file)
                console.log(file)
            }
        })
    }
}

getCommits()
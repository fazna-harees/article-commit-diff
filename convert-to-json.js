/* eslint-disable consistent-return */
const path = require("path");
const fs = require("fs");
const axios = require('axios');

const dirPath = path.join(__dirname, "./articles");
const postlist = [];

const forEachPost = (file, i) => {
    const obj = {};
      let post;
      // eslint-disable-next-line @typescript-eslint/no-shadow
      fs.readFile(`${dirPath}/${file}`, "utf8", (err, contents) => {
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

        postlist.push(post);
        if (i === files.length - 1) {
          const data = JSON.stringify(postlist);
          fs.writeFileSync("src/posts.json", data);
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

const getCommits = async() => {
    const {data:commits} = await axios.get('https://api.github.com/repos/fazna-harees/article-commit-diff/commits')
    const last_commit = commits[0]
    const {data:last_tree} = await axios.get(last_commit.commit.tree.url)
    const articles = last_tree.tree.find(i => i.path==="articles")
    const {data:mdfiles} = await axios.get(articles.url)
    mdfiles.tree.forEach(i => {
        console.log(i.path)
    })
}

getCommits()
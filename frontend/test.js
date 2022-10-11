// A testing file -- not used in the actual app

// console.log(document.getElementsByClassName("wtf"))
// base URL = https://e621.net/posts/.json
// params = limit?=[number]
const BASE_URL = 'https://e621.net/posts'
// copied the tags here from the ones on furbot, as well as filtering out animated media files 
const BLACKLIST = ['gore', 'scat', 'feral', 'cub', 'loli', 'young', 'forced', 'animated', 'flash'];
const META_MODIFIERS = ['score:>=25', 'gentags:>=10', 'rating:explicit', 'order:random'];


// + for tags you want to include
// - for tags you don't want to include
async function getPosts(numPosts=10) {
    const URL = `${BASE_URL}.json?limit=${10}&tags=+-${BLACKLIST.join('+-')}+${META_MODIFIERS.join('+')}`;
    const response = await fetch(URL);
    const posts = response.json().then(data => {
        console.log(data);
        // return a list of the file urls
        return data.posts.map(post => post.file.url);
    }).catch(err => console.log(err));
    return posts;
}

function appendImage(image_url) {
    const list = document.getElementById('posts-container');
    const entry = document.createElement('li');
    // Create the Image
    const image = new Image();
    image.src = image_url;
    // add the image to the li
    entry.appendChild(image);
    // add the li to the list
    list.appendChild(entry);
}

let cache = [];

async function getP() {
  if (cache.length === 0) {
    cache = await getPosts()
  } 
  return cache
}

document.getElementById('display-post').addEventListener("click", async () => {
    await getP();
    if (cache.length > 0) {
        appendImage(cache.pop())
    }
    else {
        console.log("Posts exhausted :(");
    }
});

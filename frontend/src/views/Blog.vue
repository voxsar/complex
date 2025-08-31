<template>
  <div class="blog-pagev1">
    <div class="blogs-page">
      <div class="postWrapper" v-for="(post, index) in posts" :key="index">
        <a class="post-img" href="#">
          <img :src="post.img" alt="" />
        </a>
        <div class="date">
          <span class="poster">{{ post.date }}</span>
          <div class="post-info">
            <div class="postDetails">Post by: {{ post.author }}</div>
          </div>
        </div>
        <div class="post-title">
          <a href="#">{{ post.title }}</a>
        </div>
        <div class="post-content">
          <p>{{ post.content }}</p>
        </div>
        <div class="link-readmore">
          <a title="Read more" href="#">READ MORE</a>
        </div>
      </div>
    </div>
    <div class="blog-toolbar">
      <div class="toolbar clearfix">
        <div class="toolbar-inner">
          <div class="pager">
            <div class="pages">
              <ol>
                <li class="current">1</li>
                <li><a href="#">2</a></li>
                <li><a href="#">3</a></li>
                <li><a href="#">4</a></li>
                <li><a class="next i-next" title="Next" href="#"></a></li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const posts = [
  {
    img: 'https://via.placeholder.com/600x400',
    date: 'JUL 12, 2015',
    author: 'KomodoArt',
    title: 'Donec scelerisque quam vitae est.',
    content:
      'Duis imperdiet diam pharetra nisi. Fusce accumsan. Fusce adipiscing, felis non ornare egestas, risus elit placerat mauris, in mollis ante erat quis nisi. Quisque sed ipsum. Vestibulum eu risus. hasellus tempus massa aliquet urna. Integer fringilla quam eget dolor.',
  },
  {
    img: 'https://via.placeholder.com/600x400',
    date: 'JUL 12, 2015',
    author: 'KomodoArt',
    title: 'Donec scelerisque quam vitae est.',
    content:
      'Duis imperdiet diam pharetra nisi. Fusce accumsan. Fusce adipiscing, felis non ornare egestas, risus elit placerat mauris, in mollis ante erat quis nisi. Quisque sed ipsum. Vestibulum eu risus. hasellus tempus massa aliquet urna. Integer fringilla quam eget dolor.',
  },
  {
    img: 'https://via.placeholder.com/600x400',
    date: 'JUL 12, 2015',
    author: 'KomodoArt',
    title: 'Donec scelerisque quam vitae est.',
    content:
      'Duis imperdiet diam pharetra nisi. Fusce accumsan. Fusce adipiscing, felis non ornare egestas, risus elit placerat mauris, in mollis ante erat quis nisi. Quisque sed ipsum. Vestibulum eu risus. hasellus tempus massa aliquet urna. Integer fringilla quam eget dolor.',
  },
  {
    img: 'https://via.placeholder.com/600x400',
    date: 'JUL 12, 2015',
    author: 'KomodoArt',
    title: 'Donec scelerisque quam vitae est.',
    content:
      'Duis imperdiet diam pharetra nisi. Fusce accumsan. Fusce adipiscing, felis non ornare egestas, risus elit placerat mauris, in mollis ante erat quis nisi. Quisque sed ipsum. Vestibulum eu risus. hasellus tempus massa aliquet urna. Integer fringilla quam eget dolor.',
  },
];
</script>

<style scoped>
.blog-pagev1 .blogs-page {
  padding: 20px 0;
}

.blog-pagev1 .postWrapper {
  margin-bottom: 60px;
}

.blog-pagev1 .postWrapper .post-img img {
  width: 100%;
  display: block;
}

.blog-pagev1 .postWrapper .date {
  font-size: 12px;
  color: #5f5f5f;
  padding: 3px 0;
  border-top: 1px solid #eaeaea;
  border-bottom: 1px solid #eaeaea;
}

.blog-pagev1 .postWrapper .date .post-info {
  display: inline-block;
  padding-left: 15px;
}

.blog-pagev1 .postWrapper .date .poster {
  padding-right: 19px;
  position: relative;
}

.blog-pagev1 .postWrapper .post-title {
  font-size: 20px;
  margin: 15px 0;
}

.blog-pagev1 .postWrapper .post-content {
  color: #5f5f5f;
  padding-top: 4px;
}

.blog-pagev1 .postWrapper .link-readmore {
  margin-top: 10px;
}

.blog-pagev1 .postWrapper .link-readmore a {
  color: #333;
  text-decoration: underline;
}

.blog-pagev1 .blog-toolbar .pages {
  display: flex;
  list-style: none;
  padding: 0;
  gap: 8px;
}

.blog-pagev1 .blog-toolbar .pages li {
  display: inline-block;
}

.blog-pagev1 .blog-toolbar .pages .current {
  font-weight: bold;
}
</style>


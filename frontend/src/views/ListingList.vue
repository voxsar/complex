<template>
  <div id="sns_wrapper">
    <Header />
    <div id="sns_content" class="wrap layout-lm">
      <div class="container">
        <div class="row">
          <aside id="sns_left" class="col-md-3"></aside>
          <div id="sns_main" class="col-md-9 col-main">
            <div class="sns-products-container clearfix">
              <ol id="products-list" class="products-list clearfix">
                <li class="item" v-for="p in products" :key="p.id">
                  <div class="item-inner product_list_style">
                    <div class="col-left">
                      <div class="item-img">
                        <a class="product-image have-additional" href="#">
                          <span class="img-main">
                            <img :src="p.image" :alt="p.title" />
                          </span>
                        </a>
                      </div>
                    </div>
                    <div class="col-right">
                      <div class="item-title">
                        <a href="#">{{ p.title }}</a>
                      </div>
                      <div class="item-price">
                        <span class="price1">{{ p.price }}</span>
                      </div>
                      <div class="desc std">
                        <p>{{ p.description }}</p>
                      </div>
                      <div class="actions">
                        <button class="btn-cart">Add to Cart</button>
                      </div>
                    </div>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import Header from '../components/Header.vue';
import Footer from '../components/Footer.vue';

const products = [
  {
    id: 1,
    title: 'Modular Modern',
    image: 'https://via.placeholder.com/205x205',
    price: '$ 540.00',
    description: 'Ut metus. Maecenas dapibus nibh eu est.'
  },
  {
    id: 2,
    title: 'Decor Accent',
    image: 'https://via.placeholder.com/205x205',
    price: '$ 380.00',
    description: 'Integer aliquet tellus in felis.'
  },
  {
    id: 3,
    title: 'Interior Upholstery',
    image: 'https://via.placeholder.com/205x205',
    price: '$ 620.00',
    description: 'Sed eu velit. Maecenas molestie.'
  }
];
</script>

<style scoped>
.products-list {
  list-style: none;
  margin-top: -3px;
  margin-bottom: 30px;
  padding: 0;
}
.products-list > li.item {
  display: flex;
  margin-top: 25px;
}
.products-list > li.item:first-child {
  margin-top: 0;
}
.item-img {
  border: 1px solid #eaeaea;
  width: 205px;
  margin-right: 20px;
}
.item-img img {
  display: block;
  width: 100%;
}
.item-title {
  margin-bottom: 10px;
  text-transform: uppercase;
}
.item-title a {
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
  text-decoration: none;
}
.item-price {
  margin-bottom: 10px;
}
.price1 {
  font-size: 16px;
  color: #222;
  font-weight: bold;
}
.desc {
  margin: 10px 0 18px;
  color: #666;
}
.actions {
  margin-top: 20px;
}
.btn-cart {
  width: 174px;
  height: 36px;
  background: #fff;
  border: 1px solid #eaeaea;
  text-transform: uppercase;
  font-weight: bold;
  color: #666;
  line-height: 36px;
  cursor: pointer;
}
.btn-cart:hover {
  background: #ff5e00;
  border-color: #ff5e00;
  color: #fff;
}
</style>


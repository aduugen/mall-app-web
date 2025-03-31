<template>
	<view>
		<!-- 顶部大图 -->
		<view class="top-image">
			<view class="image-wrapper">
				<image :src="brand.bigPic" class="loaded" mode="aspectFill"></image>
			</view>
		</view>
		<!-- 品牌信息 -->
		<view class="info">
			<view class="image-wrapper">
				<image :src="brand.logo" class="loaded" mode="aspectFit"></image>
			</view>
			<view class="title">
				<text :class="{Skeleton:!loaded}">{{brand.name}}</text>
				<text :class="{Skeleton:!loaded}">品牌首字母：{{brand.firstLetter}}</text>
			</view>
			<view>
				<text class="yticon icon-shoucang" :class="{active: favoriteStatus}" @click="favorite()"></text>
			</view>
		</view>
		<!-- 品牌故事 -->
		<view class="section-tit">品牌故事</view>
		<view class="brand-story">
			<text class="text">{{brand.brandStory}}</text>
		</view>
		<!-- 相关商品 -->
		<view class="section-tit">相关商品</view>
		<view class="goods-list">
			<view v-for="(item, index) in productList" :key="index" class="goods-item" @click="navToDetailPage(item)">
				<view class="image-wrapper">
					<image :src="item.pic" mode="aspectFill"></image>
				</view>
				<text class="title clamp">{{item.name}}</text>
				<text class="title2">{{item.subTitle}}</text>
				<view class="price-box">
					<text class="price" v-if="item.promotionPrice">￥{{item.promotionPrice}}</text>
					<text class="price-original" v-if="item.promotionPrice">￥{{item.price}}</text>
					<text class="price" v-else>￥{{item.price}}</text>
					<text class="sales">已售 {{item.sale}}</text>
					<view class="cart-box" v-if="item.price > 0 || item.promotionPrice > 0">
						<text class="iconfont icon-cart" @click.stop="quickAddToCart(item)"></text>
					</view>
				</view>
			</view>
		</view>
		<uni-load-more :status="loadingType"></uni-load-more>
	</view>
</template>

<script>
	import share from '@/components/share';
	import {
		getBrandDetail,
		fetchBrandProductList
	} from '@/api/brand.js';
	import {
		createBrandAttention,
		deleteBrandAttention,
		brandAttentionDetail
	} from '@/api/memberBrandAttention.js';
	import {
		addCartItem,
		fetchCartList
	} from '@/api/cart.js';
	import uniLoadMore from '@/components/uni-load-more/uni-load-more.vue';
	import {
		mapState
	} from 'vuex';
	import { API_BASE_URL } from '@/utils/appConfig.js';
	export default {
		components: {
			share,
			uniLoadMore
		},
		data() {
			return {
				loaded: false,
				brand: {},
				productList:[],
				loadingType: 'more',
				favoriteStatus:false,
				queryParam: {
					brandId: null,
					pageNum: 1,
					pageSize: 4
				},
				cartItemsMap: {} // 存储购物车中商品的数量
			};
		},
		async onLoad(options) {
			this.loaded = true;
			let id = options.id;
			
			try {
				// 并行加载品牌详情和商品数据
				const brandPromise = getBrandDetail(id);
				
				// 设置查询参数
				this.queryParam.brandId = id;
				
				// 等待品牌详情加载完成
				const brandResponse = await brandPromise;
				this.brand = brandResponse.data;
				this.initBrandAttention();
				
				// 加载商品列表
				await this.loadData('refresh');
				
				// 加载购物车数据
				await this.loadCartItems();
			} catch (error) {
				console.error('页面加载失败:', error);
				uni.showToast({
					title: '数据加载失败，请重试',
					icon: 'none'
				});
			}
		},
		async onShow() {
			// 页面每次显示时都重新获取购物车数据
			await this.loadCartItems();
			
			// 重新处理商品价格
			if (this.productList && this.productList.length > 0) {
				await this.processProductPrices();
			}
		},
		computed: {
			...mapState(['hasLogin'])
		},
		methods: {
			imageOnLoad(key, index) {
				this.$set(this.data[key][index], 'loaded', 'loaded');
			},
			//收藏
			favorite() {
				if (!this.checkForLogin()) {
					return;
				}
				if (this.favoriteStatus) {
					//取消收藏
					deleteBrandAttention({
						brandId: this.brand.id
					}).then(response => {
						this.favoriteStatus = !this.favoriteStatus;
					});
				} else {
					//收藏
					let brandAttention = {
						brandId : this.brand.id,
						brandName : this.brand.name,
						brandLogo : this.brand.logo,
						brandCity : ""
					}
					createBrandAttention(brandAttention).then(response=>{
						this.favoriteStatus = !this.favoriteStatus;
					});
				}
			},
			//详情
			navToDetailPage(item) {
				let id = item.id;
				uni.navigateTo({
					url: `/pages/product/product?id=${id}`
				})
			},
			
			// 快速添加到购物车
			quickAddToCart(item) {
				// 阻止事件冒泡
				event.stopPropagation();
				
				// 检查登录状态
				if (!this.hasLogin) {
					uni.showModal({
						title: '提示',
						content: '你还没登录，是否要登录？',
						confirmText: '去登录',
						cancelText: '取消',
						success: function(res) {
							if (res.confirm) {
								uni.navigateTo({
									url: '/pages/public/login'
								})
							}
						}
					});
					return;
				}
				
				// 检查商品数据完整性
				if (!item || !item.id) {
					uni.showToast({
						title: '商品数据不完整',
						icon: 'none',
						duration: 2000
					});
					return;
				}
				
				// 如果商品有多个规格，提示用户进入详情页选择
				if (item.specType === 1) {
					uni.showToast({
						title: '该商品有多种规格，请进入详情页选择',
						icon: 'none',
						duration: 2000
					});
					setTimeout(() => {
						this.navToDetailPage(item);
					}, 2000);
					return;
				}
				
				// 构建购物车项数据
				let cartItem = {
					price: item.promotionPrice || item.price || 0,
					productAttr: "[]",
					productBrand: item.brandName || "",
					productCategoryId: item.productCategoryId || 0,
					productId: item.id,
					productName: item.name || "商品",
					productPic: item.pic || "",
					productSkuId: 0, // 默认SKU ID
					productSn: item.productSn || "",
					productSubTitle: item.subTitle || "",
					quantity: 1
				};
				
				// 添加到购物车
				uni.showLoading({
					title: '添加中...'
				});
				
				addCartItem(cartItem).then(response => {
					uni.hideLoading();
					uni.showToast({
						title: response.message || '添加成功',
						icon: 'success',
						duration: 1500
					});
					
					// 添加成功后重新获取购物车数据
					this.loadCartItems();
				}).catch(error => {
					uni.hideLoading();
					console.error('添加购物车失败:', error);
					uni.showToast({
						title: '添加失败，请到详情页选择规格',
						icon: 'none',
						duration: 1500
					});
					setTimeout(() => {
						this.navToDetailPage(item);
					}, 1500);
				});
			},
			
			// 加载购物车数据
			async loadCartItems() {
				if (!this.hasLogin) return;
				
				try {
					const response = await fetchCartList();
					if (response && response.data) {
						// 将购物车数据转换为映射，方便获取每个商品的数量
						const itemsMap = {};
						response.data.forEach(item => {
							itemsMap[item.productId] = (itemsMap[item.productId] || 0) + item.quantity;
						});
						this.cartItemsMap = itemsMap;
					}
				} catch (error) {
					console.error('获取购物车数据失败:', error);
				}
			},
			
			//加载商品 ，带下拉刷新和上滑加载
			async loadData(type = 'add', loading) {
				//没有更多直接返回
				if (type === 'add') {
					if (this.loadingType === 'nomore') {
						return;
					}
					this.loadingType = 'loading';
				} else {
					this.loadingType = 'more'
				}
			
				if (type === 'refresh') {
					this.queryParam.pageNum=1;
					this.productList = [];
				}
				
				try {
					const response = await fetchBrandProductList(this.queryParam);
					let productList = response.data.list;
					
					if (productList.length === 0) {
						//没有更多了
						this.loadingType = 'nomore';
						this.queryParam.pageNum--;
					} else {
						if (productList.length < this.queryParam.pageSize) {
							this.loadingType = 'nomore';
							this.queryParam.pageNum--;
						} else {
							this.loadingType = 'more';
						}
						
						this.productList = this.productList.concat(productList);
						
						// 处理商品价格 - 注意这里使用await确保异步操作完成
						await this.processProductPrices();
					}
					
					if (type === 'refresh') {
						if (loading == 1) {
							uni.hideLoading()
						} else {
							uni.stopPullDownRefresh();
						}
					}
				} catch (error) {
					console.error('加载商品数据失败:', error);
					if (type === 'refresh') {
						if (loading == 1) {
							uni.hideLoading()
						} else {
							uni.stopPullDownRefresh();
						}
					}
				}
			},
			
			// 处理所有商品列表的价格逻辑
			async processProductPrices() {
				if (this.productList && this.productList.length > 0) {
					for (const product of this.productList) {
						await this.updateProductPrice(product);
					}
				}
			},
			
			// 更新单个商品的价格
			async updateProductPrice(product) {
				// 检查商品是否缺少价格信息
				if ((product.price === undefined || product.price === null || product.price === 0) || 
					(product.promotionPrice === undefined || product.promotionPrice === null || product.promotionPrice === 0)) {
					
					console.log(`商品[${product.id}]缺少价格信息，尝试从SKU获取`);
					
					// 从API获取SKU信息
					const skuList = await this.fetchProductSku(product.id);
					
					// 如果有SKU数据
					if (skuList && skuList.length > 0) {
						const defaultSku = skuList[0]; // 使用第一个SKU
						
						// 使用SKU的价格
						if (defaultSku.price && defaultSku.price > 0) {
							product.price = defaultSku.price;
							console.info('价格信息', {
								操作: '从SKU获取价格',
								价格: product.price,
								商品ID: product.id,
								商品名称: product.name
							});
						}
						
						// 如果SKU有促销价格且大于0，使用促销价格
						if (defaultSku.promotionPrice && defaultSku.promotionPrice > 0) {
							product.promotionPrice = defaultSku.promotionPrice;
							console.info('价格信息', {
								操作: '从SKU获取促销价',
								价格: product.promotionPrice,
								商品ID: product.id,
								商品名称: product.name
							});
						}
						
						console.log(`已更新商品[${product.id}]价格: ${product.price}, 促销价: ${product.promotionPrice}`);
					} else {
						console.warn(`商品[${product.id}]没有找到SKU数据`);
					}
				}
				
				// 处理促销价逻辑
				if (product.promotionPrice && parseFloat(product.promotionPrice) < parseFloat(product.price)) {
					// 保持促销价不变
				} else if (product.promotionPrice) {
					// 如果促销价大于等于原价，则不显示促销价
					product.promotionPrice = null;
				}
			},
			
			// 获取商品SKU信息
			fetchProductSku(productId) {
				return new Promise((resolve, reject) => {
					// 使用uni.request直接请求商品详情API
					const url = API_BASE_URL + '/product/detail/' + productId;
					console.log(`请求商品[${productId}]SKU，URL: ${url}`);
					
					uni.request({
						url: url,
						method: 'GET',
						header: {
							'Content-Type': 'application/json',
							'Authorization': uni.getStorageSync('token') || '' // 确保携带token
						},
						success: (res) => {
							// 记录返回状态码，帮助诊断问题
							console.log(`商品[${productId}]SKU请求响应状态码: ${res.statusCode}`);
							
							// 添加更全面的检查，确保返回的数据是JSON而不是HTML
							if (typeof res.data === 'string') {
								console.error(`商品[${productId}]SKU获取失败: 服务器返回了字符串而不是JSON数据`);
								console.error('返回内容片段:', res.data.substring(0, 100));
								
								// 如果返回的是登录页面，提示可能是登录失效
								if (res.data.includes('<!DOCTYPE html>') && res.data.includes('login')) {
									console.error('可能是登录已过期，请尝试重新登录');
								}
								
								// 返回空数组，避免中断处理流程
								resolve([]);
								return;
							}
							
							if (res.statusCode === 200 && res.data && res.data.code === 200) {
								// 返回SKU库存信息
								const skuList = res.data.data && res.data.data.skuStockList ? res.data.data.skuStockList : [];
								console.log(`商品[${productId}]获取到${skuList.length}个SKU`);
								
								// 如果列表为空但返回了其他数据，记录一下帮助调试
								if (skuList.length === 0 && res.data.data) {
									console.log('返回的商品数据结构:', Object.keys(res.data.data));
								}
								
								resolve(skuList);
							} else {
								// 记录更详细的错误信息
								console.error(`商品[${productId}]SKU获取失败:`, {
									statusCode: res.statusCode,
									code: res.data ? res.data.code : 'unknown',
									message: res.data ? res.data.message : 'No message'
								});
								
								// 如果API调用成功但返回错误，返回空数组而不是拒绝Promise
								resolve([]);
							}
						},
						fail: (err) => {
							console.error(`商品[${productId}]SKU请求失败:`, err);
							// 发生网络错误时，同样返回空数组
							resolve([]);
						}
					});
				});
			},
			
			//下拉刷新
			onPullDownRefresh() {
				this.loadData('refresh');
			},
			//加载更多
			onReachBottom() {
				this.queryParam.pageNum++;
				this.loadData();
			},
			//初始化收藏状态
			initBrandAttention(){
				if(this.hasLogin){
					brandAttentionDetail({brandId:this.brand.id}).then(response=>{
						this.favoriteStatus = response.data!=null;
					});
				}
			},
			//检查登录状态并弹出登录框
			checkForLogin() {
				if (!this.hasLogin) {
					uni.showModal({
						title: '提示',
						content: '你还没登录，是否要登录？',
						confirmText: '去登录',
						cancelText: '取消',
						success: function(res) {
							if (res.confirm) {
								uni.navigateTo({
									url: '/pages/public/login'
								})
							} else if (res.cancel) {
								console.log('用户点击取消');
							}
						}
					});
					return false;
				} else {
					return true;
				}
			},
		}
	}
</script>

<style lang="scss">
	page {
		background: $page-color-base;
	}

	.top-image {
		height: 200px;

		.image-wrapper {
			display: flex;
			justify-content: center;
			align-content: center;
			width: 100%;
			height: 100%;
			overflow: hidden;

			image {
				width: 100%;
				height: 100%;
			}
		}
	}

	.info {
		display: flex;
		align-items: center;
		padding: 30upx 50upx;
		background: #fff;
		margin-top: 16upx;
		.image-wrapper {
			width: 210upx;
			height: 70upx;
			background: #fff;
			image{
				width:100%;
				height: 100%;
			}
		}

		.title {
			flex: 1;
			display: flex;
			flex-direction: column;
			font-size: $font-lg+4upx;
			margin-left: 30upx;
			color: $font-color-dark;
			text:last-child {
				font-size: $font-sm;
				color: $font-color-light;
				margin-top: 8upx;
				&.Skeleton{
					width:220upx;
				}
			}
		}

		.yticon {
			font-size: 80upx;
			color: $font-color-base;
			margin: 0 10upx 0 30upx;
			&.active {
				color: #ff4443;
			}
		}
	}

	.brand-story {
		display: flex;
		padding: 30upx;
		background: #fff;

		.text {
			font-size: $font-sm;
			color: $font-color-light;
		}
	}

	.actions {
		padding: 10upx 28upx;
		background: #fff;

		.yticon {
			font-size: 46upx;
			color: $font-color-base;
			padding: 10upx 12upx;

			&.active {
				color: #ff4443;
			}

			&:nth-child(2) {
				font-size: 50upx;
			}
		}
	}
	
	.section-tit {
		font-size: $font-base+2upx;
		color: $font-color-dark;
		background: #fff;
		margin-top: 16upx;
		text-align: center;
		padding-top: 20upx;
		padding-bottom: 20upx;
	}

	/* 商品列表 */
	.goods-list {
		display: flex;
		flex-wrap: wrap;
		padding: 0 30upx;
		background: #fff;
		width: 100%;
		box-sizing: border-box;
	
		.goods-item {
			display: flex;
			flex-direction: column;
			width: 48%;
			padding: 15upx;
			margin-bottom: 20upx;
			border-radius: 12upx;
			background-color: #fff;
			box-shadow: 0 5upx 25upx rgba(0, 0, 0, 0.1);
	
			&:nth-child(2n+1) {
				margin-right: 4%;
			}
		}
	
		.image-wrapper {
			width: 100%;
			height: 330upx;
			border-radius: 8upx;
			overflow: hidden;
			margin-bottom: 10upx;
	
			image {
				width: 100%;
				height: 100%;
				opacity: 1;
			}
		}
	
		.title {
			font-size: $font-lg;
			color: $font-color-dark;
			line-height: 80upx;
			padding: 0 8upx;
		}
	
		.title2 {
			font-size: $font-sm;
			color: $font-color-light;
			line-height: 40upx;
			height: 80upx;
			padding: 0 8upx;
			overflow: hidden;
			text-overflow: ellipsis;
			display: block;
		}
	
		.price-box {
			width: 100%;
			padding: 10upx 8upx;
			margin-top: 5upx;
			display: flex;
			align-items: center;
			justify-content: flex-start;
		}
	
		.price {
			color: #f04c41;
			font-size: $font-lg;
			line-height: 1;
			margin-right: 8upx;
	
			&:before {
				content: '';
				font-size: 26upx;
			}
		}
	
		.price-original {
			color: $uni-color-primary;
			font-size: $font-sm + 2upx;
			text-decoration: line-through;
		}
	
		.sales {
			font-size: $font-sm;
			color: $font-color-light;
			margin-left: 10upx;
		}
		
		.cart-box {
			margin-left: auto;
			position: relative;
			
			.iconfont {
				font-size: 40upx;
				color: $uni-color-primary;
			}
		}
	}
</style>

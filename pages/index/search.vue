<template>
	<view class="container" @click="hideHistoryKeywords">
		<view class="container-item search-header" @click.stop>
			<view class="search-box">
				<view class="search-input-box">
					<text class="search-icon iconfont icon-search"></text>
					<input 
						class="search-input" 
						type="text" 
						v-model="searchValue" 
						placeholder="请输入商品关键词" 
						confirm-type="search"
						@confirm="searchByKeyword"
						@focus="showHistoryKeywords = true"
						@blur="onInputBlur"
					/>
					<text class="clear-icon iconfont icon-close" v-if="searchValue" @click="clearSearchValue"></text>
				</view>
				<view class="search-btn" @click="searchByKeyword">搜索</view>
			</view>
			
			<!-- 搜索历史记录 -->
			<view class="search-history" v-if="showHistoryKeywords">
				<view class="history-header">
					<text class="history-title">最近搜索</text>
					<text class="clear-history" @click="clearHistoryKeywords" v-if="historyKeywords.length > 0">清空</text>
				</view>
				<view class="history-list" v-if="historyKeywords.length > 0">
					<view 
						class="history-item" 
						v-for="(keyword, index) in historyKeywords" 
						:key="index"
						@click="useHistoryKeyword(keyword)"
					>
						<text class="iconfont icon-clock history-icon"></text>
						<text class="history-keyword">{{keyword}}</text>
					</view>
				</view>
				<view class="no-history" v-else>
					<text class="no-history-text">暂无搜索记录</text>
				</view>
			</view>
		</view>
		<view class="container-item">
			<view class="navbar" >
				<view class="nav-item" :class="{current: filterIndex === 0}" @click="tabClick(0)">
					综合排序
				</view>
				<view class="nav-item" :class="{current: filterIndex === 1}" @click="tabClick(1)">
					销量优先
				</view>
				<view class="nav-item" :class="{current: filterIndex === 2}" @click="tabClick(2)">
					<text>价格</text>
					<view class="p-box">
						<text :class="{active: priceOrder === 1 && filterIndex === 2}" class="yticon icon-shang"></text>
						<text :class="{active: priceOrder === 2 && filterIndex === 2}" class="yticon icon-shang xia"></text>
					</view>
				</view>
			</view>
		</view>
		<view class="container-item">
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
		</view>   
		<!-- 浮动按钮 -->
		<view class="scroll-go-top" @click="scrollToTop">
		   <image class="scroll-arrow" src="../../static/icon_go_top.png" mode="aspectFit"></image>
		</view>
        <!-- 购物车按钮 -->
        <view class="go-to-cart" @click="navigateToCart">
            <image class="cart-icon" src="../../static/icon_cart_blue.png" mode="aspectFit"></image>
            <text class="cart-badge" v-if="cartCount > 0">{{cartCount}}</text>
        </view>
		<uni-load-more :status="loadingType"></uni-load-more>
	</view>
</template>
<script>
	import {
		searchProductList
	} from '@/api/product.js';
	import uniLoadMore from '@/components/uni-load-more/uni-load-more.vue';
	import {
		addCartItem,
		fetchCartList
	} from '@/api/cart.js';
	import {
		mapState
	} from 'vuex';
	import { API_BASE_URL } from '@/utils/appConfig.js';
    export default {
        components: {
        	uniLoadMore
        },
		data() {
			return {
				searchValue: '',
				cateMaskState: 0, //分类面板展开状态
				headerPosition: "relative",
				headerTop: "100px",
				loadingType: 'more', //加载更多状态
				filterIndex: 0,
				priceOrder: 0, //1 价格从低到高 2价格从高到低
				cateList: [],
				productList: [],
				searchParam: {
					keyword: '',
					pageNum: 1,
					pageSize: 6,
					sort: 0,
				},
				cartItemsMap: {}, // 存储购物车中商品的数量
				cartCount: 0, // 购物车中商品总数量
				showHistoryKeywords: false,
				historyKeywords: [],
				preventHideHistory: false
			}
		},
		onLoad(options) {
			this.loadData();
			// 加载购物车数据
			this.loadCartItems();
			// 加载历史搜索关键词
			this.loadHistoryKeywords();
		},
		onShow() {
			// 页面每次显示时都重新获取购物车数据
			this.loadCartItems();
			// 重新处理商品价格
			if (this.productList && this.productList.length > 0) {
				this.processProductPrices();
			}
		},
		onPageScroll(e) {
			//兼容iOS端下拉时顶部漂移
			if (e.scrollTop >= 0) {
				this.headerPosition = "fixed";
			} else {
				this.headerPosition = "absolute";
			}
		},
		//下拉刷新
		onPullDownRefresh() {
			this.loadData('refresh');
		},
		//加载更多
		onReachBottom() {
			this.searchParam.pageNum++;
			this.loadData();
		},
		methods: {
			search(res) {
				this.searchParam.keyword = res.value;
				this.loadData('refresh');
				uni.showToast({
					title: '搜索：' + res.value,
					icon: 'none'
				})
			},
			
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
					this.searchParam.pageNum=1;
					this.productList = [];
				}
				if(this.filterIndex==0){
					this.searchParam.sort=0;
				}
				if (this.filterIndex === 1) {
					this.searchParam.sort = 2;
				}
				if (this.filterIndex === 2) {
					if (this.priceOrder == 1) {
						this.searchParam.sort = 3;
					} else {
						this.searchParam.sort = 4;
					}
				}
				
				try {
					const response = await searchProductList(this.searchParam);
					let productList = response.data.list;
					
					if (productList.length === 0) {
						//没有更多了
						this.loadingType = 'nomore';
						this.searchParam.pageNum--;
					} else {
						if (productList.length < this.searchParam.pageSize) {
							this.loadingType = 'nomore';
							this.searchParam.pageNum--;
						} else {
							this.loadingType = 'more';
						}
						this.productList = this.productList.concat(productList);
						
						// 处理商品价格
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
			
			// 加载购物车数据
			async loadCartItems() {
				// 只有登录用户才能获取购物车数据
				if (!this.hasLogin) {
					this.cartItemsMap = {};
					this.cartCount = 0;
					return;
				}
				
				try {
					const response = await fetchCartList();
					if (response && response.data) {
						// 将购物车数据转为商品ID到数量的映射
						const cartMap = {};
						let totalCount = 0;
						
						response.data.forEach(item => {
							// 确保productId是字符串类型
							const productId = String(item.productId);
							// 确保quantity是数字类型
							const quantity = parseInt(item.quantity) || 0;
							
							// 累加数量到总计
							totalCount += quantity;
							
							// 如果已存在该商品，累加数量
							if (cartMap[productId]) {
								cartMap[productId] += quantity;
							} else {
								cartMap[productId] = quantity;
							}
						});
						
						this.cartItemsMap = cartMap;
						this.cartCount = totalCount;
						console.log('购物车数据映射:', this.cartItemsMap);
						console.log('购物车商品总数:', this.cartCount);
					}
				} catch (error) {
					console.error('获取购物车数据失败:', error);
				}
			},
			
			// 快速添加到购物车
			quickAddToCart(item) {
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
				
				// 首先向后端请求商品详情，获取SKU库存信息
				uni.showLoading({
					title: '正在处理...'
				});
				
				const cartItem = {
					price: item.price || 0,
					productAttr: "[]",
					productBrand: item.brandName || "",
					productCategoryId: item.productCategoryId || 0,
					productId: item.id,
					productName: item.name || "商品",
					productPic: item.pic || "",
					productSkuId: 0,
					productSn: item.productSn || "",
					productSubTitle: item.subTitle || "",
					quantity: 1
				};
				
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
			//筛选点击
			tabClick(index) {
				if (this.filterIndex === index && index !== 2) {
					return;
				}
				this.filterIndex = index;
				if (index === 2) {
					this.priceOrder = this.priceOrder === 1 ? 2 : 1;
				} else {
					this.priceOrder = 0;
				}
				uni.pageScrollTo({
					duration: 300,
					scrollTop: 0
				})
				this.loadData('refresh', 1);
				uni.showLoading({
					title: '正在加载'
				})
			},
			
			//详情
			navToDetailPage(item) {
				let id = item.id;
				uni.navigateTo({
					url: `/pages/product/product?id=${id}`
				})
			},
			scrollToTop() {
				uni.pageScrollTo({
				  scrollTop: 0,
				  duration: 300
				});
			},
			navigateToCart() {
				console.log('点击了navigateToCart');
				
				// 记录当前页面信息到本地存储，以便购物车页面返回时使用
				const currentPage = {
					path: '/pages/index/search',
					query: this.searchParam // 保存当前搜索参数
				};
				uni.setStorageSync('cartLastPage', currentPage);
				console.log('已记录当前页面:', currentPage);
				
				// 导航到购物车页面
				uni.switchTab({
					url: '/pages/cart/cart',
					success: () => {
						console.log('导航成功');
					},
					fail: (err) => {
						console.error('导航失败:', err);
					}
				});
			},
			stopPrevent() {},
			searchByKeyword() {
				if (!this.searchValue.trim()) {
					uni.showToast({
						title: '请输入搜索关键词',
						icon: 'none'
					});
					return;
				}
				
				// 保存搜索关键词到历史记录
				this.saveKeywordToHistory(this.searchValue);
				
				// 执行搜索
				this.searchParam.keyword = this.searchValue.trim();
				this.loadData('refresh');
				
				// 隐藏历史记录
				this.showHistoryKeywords = false;
				
				uni.showToast({
					title: '搜索：' + this.searchValue,
					icon: 'none'
				});
			},
			
			// 隐藏历史关键词
			hideHistoryKeywords() {
				this.showHistoryKeywords = false;
			},
			
			// 处理输入框失焦事件
			onInputBlur() {
				// 延迟隐藏，以便点击历史记录项
				setTimeout(() => {
					if (!this.preventHideHistory) {
						this.showHistoryKeywords = false;
					}
					this.preventHideHistory = false;
				}, 200);
			},
			
			// 加载历史搜索关键词
			loadHistoryKeywords() {
				try {
					const historyStr = uni.getStorageSync('searchHistoryKeywords');
					if (historyStr) {
						this.historyKeywords = JSON.parse(historyStr);
					}
				} catch (e) {
					console.error('加载搜索历史失败:', e);
					this.historyKeywords = [];
				}
			},
			
			// 保存关键词到历史记录
			saveKeywordToHistory(keyword) {
				if (!keyword || !keyword.trim()) return;
				
				keyword = keyword.trim();
				
				// 从历史记录中移除相同的关键词
				const index = this.historyKeywords.indexOf(keyword);
				if (index !== -1) {
					this.historyKeywords.splice(index, 1);
				}
				
				// 将关键词添加到列表开头
				this.historyKeywords.unshift(keyword);
				
				// 保留最近的20个关键词
				if (this.historyKeywords.length > 20) {
					this.historyKeywords = this.historyKeywords.slice(0, 20);
				}
				
				// 保存到本地存储
				this.saveHistoryKeywordsToStorage();
			},
			
			// 将历史关键词保存到本地存储
			saveHistoryKeywordsToStorage() {
				try {
					uni.setStorageSync('searchHistoryKeywords', JSON.stringify(this.historyKeywords));
				} catch (e) {
					console.error('保存搜索历史失败:', e);
				}
			},
			
			clearSearchValue() {
				this.searchValue = '';
			},
			
			clearHistoryKeywords() {
				uni.showModal({
					title: '提示',
					content: '确定要清空搜索历史吗？',
					success: (res) => {
						if (res.confirm) {
							this.historyKeywords = [];
							this.saveHistoryKeywordsToStorage();
							uni.showToast({
								title: '已清空搜索历史',
								icon: 'none'
							});
						}
					}
				});
			},
			
			useHistoryKeyword(keyword) {
				// 防止失焦事件隐藏历史记录
				this.preventHideHistory = true;
				
				this.searchValue = keyword;
				this.searchByKeyword();
			}
		},
		computed: {
			...mapState(['hasLogin'])
		}
	}	
</script>
<style lang="scss">
	.container {
		display: flex;
	    flex-direction: column; // 明确设置为垂直布局
		align-items: stretch; /* 子元素沿交叉轴（水平方向）拉伸 */
		width: 100%;
		background: $page-color-base;
	    //padding-top: 96upx; // 注意这个上边距可能会影响整体布局
	}
	.container-item {
	  position: relative; /* 使用 relative 或 static 而不是 fixed */
	}
	.search-header {
		padding: 20upx;
		background: #fff;
		border-bottom: 1upx solid #f5f5f5;
		position: relative;
		z-index: 100;
	}
	.search-box {
		display: flex;
		align-items: center;
		height: 80upx;
	}
	.search-input-box {
		flex: 1;
		display: flex;
		align-items: center;
		height: 100%;
		background-color: #f5f5f5;
		border-radius: 40upx;
		padding: 0 20upx;
	}
	.search-icon {
		font-size: 40upx;
		color: #909399;
	}
	.search-input {
		flex: 1;
		height: 100%;
		padding: 0 10upx;
		font-size: 28upx;
	}
	.clear-icon {
		font-size: 36upx;
		color: #909399;
		padding: 10upx;
	}
	.search-btn {
		width: 120upx;
		height: 70upx;
		line-height: 70upx;
		margin-left: 20upx;
		background: $uni-color-primary;
		color: #fff;
		border-radius: 35upx;
		font-size: 28upx;
		text-align: center;
	}
	.search-history {
		margin-top: 20upx;
		padding: 10upx 0;
		background: #fff;
		border-radius: 12upx;
		box-shadow: 0 2upx 10upx rgba(0, 0, 0, 0.05);
	}
	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 20upx 20upx;
		border-bottom: 1upx solid #f5f5f5;
	}
	.history-title {
		font-size: 30upx;
		color: $font-color-dark;
		font-weight: bold;
	}
	.clear-history {
		font-size: 28upx;
		color: $uni-color-primary;
		padding: 5upx 10upx;
	}
	.history-list {
		display: flex;
		flex-wrap: wrap;
		padding: 20upx;
	}
	.history-item {
		padding: 10upx 20upx;
		background: #f8f8f8;
		border-radius: 30upx;
		margin-right: 20upx;
		margin-bottom: 20upx;
		display: flex;
		align-items: center;
		transition: all 0.2s;
	}
	.history-item:active {
		background: #e6e6e6;
	}
	.history-icon {
		font-size: 28upx;
		color: #909399;
		margin-right: 10upx;
	}
	.history-keyword {
		font-size: 28upx;
		color: $font-color-dark;
	}
	.no-history {
		padding: 40upx 0;
		text-align: center;
	}
	.no-history-text {
		font-size: 28upx;
		color: #909399;
	}
	.navbar {
		display: flex;
		width: 100%;
		height: 80upx;
		background: #fff;
		box-shadow: 0 2upx 10upx rgba(0, 0, 0, .06);
		z-index: 100;
	
		.nav-item {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;
			font-size: 30upx;
			color: $font-color-dark;
			position: relative;
	
			&.current {
				color: $uni-color-primary;
	
				&:after {
					content: '';
					position: absolute;
					left: 50%;
					bottom: 0;
					transform: translateX(-50%);
					width: 120upx;
					height: 0;
					border-bottom: 4upx solid $uni-color-primary;
				}
			}
		}
	
		.p-box {
			display: flex;
			flex-direction: column;
	
			.yticon {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 30upx;
				height: 14upx;
				line-height: 1;
				margin-left: 4upx;
				font-size: 26upx;
				color: #888;
	
				&.active {
					color: $uni-color-primary;
				}
			}
	
			.xia {
				transform: scaleY(-1);
			}
		}
	
		.cate-item {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;
			width: 80upx;
			position: relative;
			font-size: 44upx;
	
			&:after {
				content: '';
				position: absolute;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
				border-left: 1px solid #ddd;
				width: 0;
				height: 36upx;
			}
		}
	}
	
	/* 分类 */
	.cate-mask {
		position: relative;
		left: 0;
		top: var(--window-top);
		bottom: 0;
		width: 100%;
		background: rgba(0, 0, 0, 0);
		z-index: 95;
		transition: .3s;
	
		.cate-content {
			width: 630upx;
			height: 100%;
			background: #fff;
			float: right;
			transform: translateX(100%);
			transition: .3s;
		}
	
		&.none {
			display: none;
		}
	
		&.show {
			background: rgba(0, 0, 0, .4);
	
			.cate-content {
				transform: translateX(0);
			}
		}
	}
	
	.cate-list {
		display: flex;
		flex-direction: column;
		height: 100%;
	
		.cate-item {
			display: flex;
			align-items: center;
			height: 90upx;
			padding-left: 30upx;
			font-size: 28upx;
			color: #555;
			position: relative;
		}
	
		.two {
			height: 64upx;
			color: #303133;
			font-size: 30upx;
			background: #f8f8f8;
		}
	
		.active {
			color: $uni-color-primary;
		}
	}
	
	/* 商品列表 */
	.goods-list {
		display: flex;
		flex-wrap: wrap;
		padding: 0 30upx;
		background: #fff;
	
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
			line-height: 1;
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
	
	.scroll-go-top {
	    position: fixed;
	    bottom: 150upx; // 调整底部位置，以便为购物车按钮腾出空间
	    right: 5upx;
	    width: 80upx;
	    height: 80upx;
	    background: rgba(255, 255, 255, 0.7);
	    border-radius: 50%;
	    display: flex;
	    justify-content: center;
	    align-items: center;
	    z-index: 1001;
	    cursor: pointer;
	    transition: opacity 0.3s ease;
	
	    .scroll-arrow {
	      //font-size: 20upx;
	      //color: #ff0000;
	    }
	
	    &:hover {
	      opacity: 0.9;
	    }
	}
	
	.go-to-cart {
	    position: fixed;
	    bottom: 60upx; // 比scroll-go-top更靠下
	    right: 5upx; // 与scroll-go-top对齐
	    width: 80upx;
	    height: 80upx;
	    background: rgba(255, 255, 255, 0.9); // 稍微提高不透明度
	    border-radius: 50%;
	    display: flex;
	    justify-content: center;
	    align-items: center;
	    z-index: 1002;
	    cursor: pointer;
	    transition: opacity 0.3s ease;
        box-shadow: 0 3upx 15upx rgba(0, 0, 0, 0.2);
	
	    .cart-icon {
	      width: 50upx;
	      height: 50upx; // 调整图片大小以适应按钮
	    }
        
        .cart-badge {
            position: absolute;
            top: -10upx;
            right: -5upx;
            min-width: 36upx;
            height: 36upx;
            line-height: 36upx;
            text-align: center;
            background-color: #f04c41;
            color: #fff;
            font-size: 22upx;
            border-radius: 18upx;
            padding: 0 8upx;
            box-sizing: border-box;
            font-weight: bold;
            box-shadow: 0 2upx 5upx rgba(0, 0, 0, 0.2);
        }
	
	    &:hover {
	      opacity: 0.9;
	    }
	}
</style>

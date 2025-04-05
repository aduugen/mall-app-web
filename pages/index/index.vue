<template>
	<view class="container">
		<!-- 头部轮播 -->
		<view class="carousel-section">
			<!-- 标题栏和状态栏占位符 -->
			<view class="titleNview-placing"></view>
			<!-- 背景色区域 -->
			<view class="titleNview-background" :style="{backgroundColor:titleNViewBackground}"></view>
			<swiper class="carousel" circular @change="swiperChange" autoplay interval="2000" duration="500">
				<swiper-item v-for="(item, index) in advertiseList" :key="index" class="carousel-item" @click="navToAdvertisePage(item)">
					<image :src="item.pic" />
				</swiper-item>
			</swiper>
			<!-- 自定义swiper指示器 -->
			<view class="swiper-dots">
				<text class="num">{{swiperCurrent+1}}</text>
				<text class="sign">/</text>
				<text class="num">{{swiperLength}}</text>
			</view>
		</view>
		
		<!-- 位置信息展示区 -->
		<view class="location-section" @click="chooseLocation" style="margin-top: 15upx;">
			<view class="location-inner">
				<text class="yticon icon-dizhi"></text>
				<text class="yticon icon-dingwei"></text>
				<text class="location-text">{{location.name || '定位中...'}}</text>
				<text class="location-tips">切换位置</text>
			</view>
		</view>

		<!-- 秒杀专区 -->
		<view class="f-header m-t" v-if="homeFlashPromotion!==null">
			<image src="/static/icon_flash_promotion.png"></image>
			<view class="tit-box">
				<text class="tit">秒杀专区</text>
				<text class="tit2">下一场 {{homeFlashPromotion.nextStartTime | formatTime}} 开始</text>
			</view>
			<view class="tit-box">
				<text class="tit2" style="text-align: right;">本场结束剩余：</text>
				<view style="text-align: right;">
					<text class="hour timer">{{timeRemaining.hours}}</text>
					<text>:</text>
					<text class="minute timer">{{timeRemaining.minutes}}</text>
					<text>:</text>
					<text class="second timer">{{timeRemaining.seconds}}</text>
				</view>
			</view>
			<text class="yticon icon-you" v-show="false"></text>
		</view>

		<view class="guess-section">
			<view v-for="(item, index) in homeFlashPromotion.productList" :key="index" class="guess-item" @click="navToDetailPage(item)">
				<view class="image-wrapper">
					<image :src="item.pic" mode="aspectFill"></image>
				</view>
				<text class="title clamp">{{item.name}}</text>
				<text class="title2 clamp">{{item.subTitle}}</text>
				<view class="price-box">
					<text class="price" v-if="item.promotionPrice">￥{{item.promotionPrice}}</text>
					<text class="price-original" v-if="item.promotionPrice">￥{{item.price}}</text>
					<text class="price" v-else>￥{{item.price}}</text>
				</view>
				<view class="cart-box" v-if="item.price > 0 || item.promotionPrice > 0">
					<text class="iconfont icon-cart" @click.stop="quickAddToCart(item)"></text>
				</view>
			</view>
		</view>
		
		<!-- 品牌制造商直供 -->
		<view class="f-header m-t" @click="navToRecommendBrandPage()">
			<image src="/static/icon_home_brand.png"></image>
			<view class="tit-box">
				<text class="tit">品牌制造商直供</text>
				<text class="tit2">工厂直达消费者，剔除品牌溢价</text>
			</view>
			<text class="yticon icon-you"></text>
		</view>

		<view class="guess-section">
			<view v-for="(item, index) in brandList" :key="index" class="guess-item" @click="navToBrandDetailPage(item)">
				<view class="image-wrapper-brand">
					<image :src="item.logo" mode="aspectFit"></image>
				</view>
				<text class="title clamp">{{item.name}}</text>
				<text class="title2">商品数量：{{item.productCount}}</text>
			</view>
		</view>

		<!-- 新鲜好物 -->
		<view class="f-header m-t" @click="navToNewProudctListPage()">
			<image src="/static/icon_new_product.png"></image>
			<view class="tit-box">
				<text class="tit">新鲜好物</text>
				<text class="tit2">为你寻觅世间好物</text>
			</view>
			<text class="yticon icon-you"></text>
		</view>
		<view class="seckill-section">
			<scroll-view class="floor-list" scroll-x>
				<view class="scoll-wrapper">
					<view v-for="(item, index) in newProductList" :key="index" class="floor-item" @click="navToDetailPage(item)">
						<image :src="item.pic" mode="aspectFill"></image>
						<text class="title clamp">{{item.name}}</text>
						<text class="title2 clamp">{{item.subTitle}}</text>
						<view class="price-box">
							<text class="price" v-if="item.promotionPrice">￥{{item.promotionPrice}}</text>
							<text class="price-original" v-if="item.promotionPrice">￥{{item.price}}</text>
							<text class="price" v-else>￥{{item.price}}</text>
						</view>
						<view class="cart-box" v-if="item.price > 0 || item.promotionPrice > 0">
							<text class="iconfont icon-cart" @click.stop="quickAddToCart(item)"></text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 人气推荐楼层 -->
		<view class="f-header m-t" @click="navToHotProudctListPage()">
			<image src="/static/icon_hot_product.png"></image>
			<view class="tit-box">
				<text class="tit">人气推荐</text>
				<text class="tit2">大家都赞不绝口的</text>
			</view>
			<text class="yticon icon-you"></text>
		</view>

		<view class="hot-section">
			<view v-for="(item, index) in hotProductList" :key="index" class="guess-item" @click="navToDetailPage(item)">
				<view class="image-wrapper">
					<image :src="item.pic" mode="aspectFill"></image>
				</view>
				<view class="txt">
					<text class="title clamp">{{item.name}}</text>
					<text class="title2">{{item.subTitle}}</text>
					<view class="price-box">
						<text class="price" v-if="item.promotionPrice">￥{{item.promotionPrice}}</text>
						<text class="price-original" v-if="item.promotionPrice">￥{{item.price}}</text>
						<text class="price" v-else>￥{{item.price}}</text>
					</view>
					<view class="cart-box" v-if="item.price > 0 || item.promotionPrice > 0">
						<text class="iconfont icon-cart" @click.stop="quickAddToCart(item)"></text>
					</view>
				</view>
			</view>
		</view>

		<!-- 猜你喜欢-->
		<view class="f-header m-t">
			<image src="/static/icon_recommend_product.png"></image>
			<view class="tit-box">
				<text class="tit">猜你喜欢</text>
				<text class="tit2">你喜欢的都在这里了</text>
			</view>
			<text class="yticon icon-you" v-show="false"></text>
		</view>

		<view class="guess-section">
			<view v-for="(item, index) in recommendProductList" :key="index" class="guess-item" @click="navToDetailPage(item)">
				<view class="image-wrapper">
					<image :src="item.pic" mode="aspectFill"></image>
				</view>
				<text class="title clamp">{{item.name}}</text>
				<text class="title2 clamp">{{item.subTitle}}</text>
				<view class="price-box">
					<text class="price" v-if="item.promotionPrice">￥{{item.promotionPrice}}</text>
					<text class="price-original" v-if="item.promotionPrice">￥{{item.price}}</text>
					<text class="price" v-else>￥{{item.price}}</text>
				</view>
				<view class="cart-box" v-if="item.price > 0 || item.promotionPrice > 0">
					<text class="iconfont icon-cart" @click.stop="quickAddToCart(item)"></text>
				</view>
			</view>
		</view>
		<uni-load-more :status="loadingType"></uni-load-more>
	</view>
</template>

<script>
	import {
		fetchContent,
		fetchRecommendProductList
	} from '@/api/home.js';
	import {
		formatDate
	} from '@/utils/date';
	import uniLoadMore from '@/components/uni-load-more/uni-load-more.vue';
	import {
		mapState
	} from 'vuex';
	import {
		addCartItem,
		fetchCartList
	} from '@/api/cart.js';
	import { API_BASE_URL } from '@/utils/appConfig.js';

	export default {
		components: {
			uniLoadMore	
		},
		data() {
			return {
				titleNViewBackground: '#003366',
				titleNViewBackgroundList: ['#003366', '#003366'],
				swiperCurrent: 0,
				swiperLength: 0,
				carouselList: [],
				goodsList: [],
				advertiseList: [],
				brandList: [],
				homeFlashPromotion: [],
				newProductList: [],
				hotProductList: [],
				recommendProductList: [],
				recommendParams: {
					pageNum: 1,
					pageSize: 4
				},
				loadingType:'more',
				worker: null,
				firstFlag: false,
			    timeRemaining: { hours: 0, minutes: 0, seconds: 0 },
				searchContent:'',
				cartItemsMap: {}, // 存储购物车中每个商品的数量
				location: { name: '' },
			};
		},
		onLoad() {
			console.log('started on load.');
			this.loadData();
			// 加载购物车数据
			this.loadCartItems();
			// 获取用户位置
			this.getUserLocation();
		},
		onShow() {
			// 页面每次显示时都重新获取购物车数据
			this.loadCartItems();
		},
		updated() {
			// 只有当homeFlashPromotion状态改变时才执行逻辑，避免重复打印警告
			if (this.homeFlashPromotion && this.homeFlashPromotion.endTime && !this.firstFlag) {
				console.log('endtime:', this.homeFlashPromotion.endTime);
				this.startCountdown();
				console.log('homeFlashPromotion:', this.homeFlashPromotion);
			}
		},
		onUnload () {
		    // 在组件卸载前终止 Worker
		    if (this.worker) {
		      this.worker.terminate();
			  this.worker = null;
		    }
		},
		//下拉刷新
		onPullDownRefresh(){
			this.recommendParams.pageNum=1;
			this.loadData();
		},
		//加载更多
		onReachBottom(){
			this.recommendParams.pageNum++;
			this.loadingType = 'loading';
			fetchRecommendProductList(this.recommendParams).then(response => {
				let addProductList = response.data;
				if(response.data.length===0){
					//没有更多了
					this.recommendParams.pageNum--;
					this.loadingType = 'nomore';
				}else{
					this.recommendProductList = this.recommendProductList.concat(addProductList);
					this.loadingType = 'more';
				}
			})
		},
		computed: {
			...mapState(['hasLogin'])
		},
		filters: {
			formatTime(time) {
				if (time == null || time === '') {
					return 'N/A';
				}
				let date = new Date(time);
				return formatDate(date, 'hh:mm:ss')
			},
		},
		methods: {
			/**
			 * 加载数据
			 */
			async loadData() {
			    try {
			        const response = await fetchContent();
			        console.log('fetchContent ok');
			        this.advertiseList = response.data.advertiseList;
			        this.swiperLength = this.advertiseList.length;
			        this.titleNViewBackground = this.titleNViewBackgroundList[0];
			        this.brandList = response.data.brandList;
			        this.homeFlashPromotion = response.data.homeFlashPromotion;
			        this.newProductList = response.data.newProductList;
			        this.hotProductList = response.data.hotProductList;
			        const recommendResponse = await fetchRecommendProductList(this.recommendParams);
			        this.recommendProductList = recommendResponse.data;
			        
			        // 处理商品价格逻辑
			        await this.processProductPrices();
			        
			        // 数据加载完成后，初始化秒杀倒计时
			        if (this.homeFlashPromotion && this.homeFlashPromotion.endTime && !this.firstFlag) {
			            this.startCountdown();
			        }
			        
			        uni.stopPullDownRefresh();
					console.log('API response:', response); // 检查API返回的内容
			    } catch (error) {
			        console.error('Error in loadData:', error);
			    }
			},
			
			// 处理所有商品列表的价格逻辑
			async processProductPrices() {
				try {
					// 处理秒杀商品
					if (this.homeFlashPromotion && this.homeFlashPromotion.productList) {
						for (const product of this.homeFlashPromotion.productList) {
							await this.updateProductPrice(product);
						}
					}
					
					// 处理新品
					for (const product of this.newProductList) {
						await this.updateProductPrice(product);
					}
					
					// 处理热门商品
					for (const product of this.hotProductList) {
						await this.updateProductPrice(product);
					}
					
					// 处理推荐商品
					for (const product of this.recommendProductList) {
						await this.updateProductPrice(product);
					}
					
					console.log('所有商品价格处理完成');
				} catch (error) {
					console.error('处理商品价格错误:', error);
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
								// 查看返回的部分内容，帮助诊断问题
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
								// 这样可以继续处理而不中断流程
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
			//轮播图切换修改背景色
			swiperChange(e) {
				const index = e.detail.current;
				this.swiperCurrent = index;
				let changeIndex = index % this.titleNViewBackgroundList.length;
				this.titleNViewBackground = this.titleNViewBackgroundList[changeIndex];
			},
			//商品详情页
			navToDetailPage(item) {
				let id = item.id;
				uni.navigateTo({
					url: `/pages/product/product?id=${id}`
				})
			},
			//广告详情页
			navToAdvertisePage(item) {
				let id = item.id;
				console.log("navToAdvertisePage",item)
			},
			//品牌详情页
			navToBrandDetailPage(item) {
				let id = item.id;
				uni.navigateTo({
					url: `/pages/brand/brandDetail?id=${id}`
				})
			},
			//推荐品牌列表页
			navToRecommendBrandPage() {
				uni.navigateTo({
					url: `/pages/brand/list`
				})
			},
			//新鲜好物列表页
			navToNewProudctListPage() {
				uni.navigateTo({
					url: `/pages/product/newProductList`
				})
			},
			//人气推荐列表页
			navToHotProudctListPage() {
				uni.navigateTo({
					url: `/pages/product/hotProductList`
				})
			},
			startCountdown() {
				if (this.firstFlag === true) {
					console.log('倒计时已经初始化，跳过重复初始化');
					return;
				}
				this.firstFlag = true;
				let endTime = new Date(this.homeFlashPromotion.endTime);
				console.log('startCountdown', endTime);
				// 创建 Worker 实例
				//if (typeof Worker !== 'undefined') {
					console.log('worker is', this.worker);
					this.worker = new Worker('http://localhost:8060/static/countdown.js');
					console.log('worker is', this.worker);
					//this.worker = uni.createWorker('../utils/countdown.js'); 	
					// 监听来自 Worker 的消息
					this.worker.onmessage = (e) => {
					    // console.log('worker msg', e.data.endTime, e.data.startTime);
						
					 	this.timeRemaining = e.data;
					 	console.log('onmessage listen',this.timeRemaining);
					 	if (e.data.seconds === 0 && e.data.minutes === 0 && e.data.hours === 0) {
					 		handleCountdownEnd();
						 }
					};
					
					// 倒计时结束的处理
					const handleCountdownEnd = () => {
						// 倒计时结束时的操作
						console.log('Countdown ended');
						if (this.worker) {
							this.worker.terminate();
							this.worker = null;
						}
					};
					
					// 监听 Worker 错误
					this.worker.onerror = (error) => {
						console.error('Worker error:', error);
						if (this.worker) {
							this.worker.terminate();
							this.worker = null;
						}
					};
					
					// 向 Worker 发送 endTime 数据
					console.log('post message', endTime.getTime());
					this.worker.postMessage(endTime.getTime());
				//}
			},
			// 加载购物车数据
			async loadCartItems() {
				// 只有登录用户才能获取购物车数据
				if (!this.hasLogin) {
					this.cartItemsMap = {};
					return;
				}
				
				try {
					const response = await fetchCartList();
					if (response && response.data) {
						// 将购物车数据转为商品ID到数量的映射
						const cartMap = {};
						response.data.forEach(item => {
							// 确保productId是字符串类型
							const productId = String(item.productId);
							// 确保quantity是数字类型
							const quantity = parseInt(item.quantity) || 0;
							
							// 如果已存在该商品，累加数量
							if (cartMap[productId]) {
								cartMap[productId] += quantity;
							} else {
								cartMap[productId] = quantity;
							}
						});
						
						this.cartItemsMap = cartMap;
						console.log('购物车数据映射:', this.cartItemsMap);
					}
				} catch (error) {
					console.error('获取购物车数据失败:', error);
					// 错误后也不阻止用户继续使用
					uni.showToast({
						title: '获取购物车数据失败',
						icon: 'none',
						duration: 1500
					});
				}
			},
			quickAddToCart(item) {
				if (!this.hasLogin) {
					uni.showModal({
						title: '提示',
						content: '请先登录后再加入购物车',
						confirmText: '去登录',
						cancelText: '取消',
						success: function(res) {
							if (res.confirm) {
								uni.navigateTo({
									url: '/pages/public/login'
								});
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
				
				// 记录原始价格信息，用于调试
				console.info("商品价格信息", {
					操作: '加入购物车',
					商品ID: item.id,
					商品名称: item.name,
					原价: item.price || '无',
					促销价: item.promotionPrice || '无'
				});
				
				// 首先向后端请求商品详情，获取SKU库存信息
				uni.showLoading({
					title: '正在处理...'
				});
				
				// 设置超时处理
				const timeout = setTimeout(() => {
					uni.hideLoading();
					uni.showToast({
						title: '请求超时，请稍后再试',
						icon: 'none',
						duration: 2000
					});
				}, 10000); // 10秒超时
				
				this.fetchProductSku(item.id).then(skuData => {
					// 清除超时
					clearTimeout(timeout);
					uni.hideLoading();
					
					// 默认使用商品自身价格
					let finalPrice = item.price || 0; 
					let skuId = 0; // 默认SKU ID
					
					try {
						// 判断商品价格和促销价格是否都为null或0
						if ((item.price === null || item.price === undefined || item.price === 0) && 
				            (item.promotionPrice === null || item.promotionPrice === undefined || item.promotionPrice === 0)) {
							
							// 如果商品本身价格为空或0，且有SKU数据，使用SKU中的价格
							if (skuData && skuData.length > 0) {
								const defaultSku = skuData[0];
								skuId = defaultSku.id || 0;
								
								// 使用SKU的价格
								if (defaultSku.price && defaultSku.price > 0) {
								    finalPrice = defaultSku.price;
									console.info('价格信息', {
										操作: '从SKU获取价格',
										价格: finalPrice,
										商品ID: item.id,
										商品名称: item.name
									});
								}
								
								// 如果SKU有促销价格且大于0，使用促销价格
								if (defaultSku.promotionPrice && defaultSku.promotionPrice > 0) {
									finalPrice = defaultSku.promotionPrice;
									console.info('价格信息', {
										操作: '从SKU获取促销价',
										价格: finalPrice,
										商品ID: item.id,
										商品名称: item.name
									});
								}
							} else {
								console.warn(`商品[${item.id}]没有找到SKU数据，使用默认价格`);
							}
						} else {
							// 商品价格不为空，优先使用商品促销价（如果有且大于0）
							if (item.promotionPrice && item.promotionPrice > 0) {
								finalPrice = item.promotionPrice;
							} else if (item.price && item.price > 0) {
								finalPrice = item.price;
							}
							
							// 设置SKU ID
							if (skuData && skuData.length > 0) {
								skuId = skuData[0].id || 0;
							}
						}
						
						// 确保价格是有效值
						if (finalPrice === null || finalPrice === undefined || isNaN(finalPrice) || finalPrice <= 0) {
							console.warn(`商品[${item.id}]的最终价格无效，使用默认价格1`);
							finalPrice = 1; // 至少为1，避免加入购物车失败
						}
						
						// 调试信息
						console.info("最终价格", {
							商品ID: item.id,
							商品名称: item.name,
							原价: item.price || '无',
							商品促销价: item.promotionPrice || '无',
							SKU价格: skuData && skuData.length > 0 ? skuData[0].price : '无',
							SKU促销价: skuData && skuData.length > 0 ? skuData[0].promotionPrice : '无',
							最终价格: finalPrice,
							SKU_ID: skuId
						});
						
						// 调用添加购物车API
						let cartItem = {
							price: finalPrice,
							productAttr: "[]",
							productBrand: item.brandName || "",
							productCategoryId: item.productCategoryId || 0,
							productId: item.id,
							productName: item.name || "商品",
							productPic: item.pic || "",
							productSkuId: skuId,
							productSn: item.productSn || "",
							productSubTitle: item.subTitle || "",
							quantity: 1
						};
						
						addCartItem(cartItem).then(response => {
							// 隐藏加载提示
							uni.hideLoading();
							clearTimeout(timeout);
							
							uni.showToast({
								title: response.message || '添加成功',
								icon: 'success',
								duration: 1500
							});
							
							// 添加成功后重新获取购物车数据
							this.loadCartItems();
						}).catch(error => {
							// 隐藏加载提示
							uni.hideLoading();
							clearTimeout(timeout);
							
							console.error('添加购物车失败:', error);
							
							// 根据错误类型显示不同提示
							if (error && error.data && error.data.code === 401) {
								// 授权失败，提示登录
								uni.showModal({
									title: '提示',
									content: '登录已过期，请重新登录',
									confirmText: '去登录',
									success: function(res) {
										if (res.confirm) {
											uni.navigateTo({
												url: '/pages/public/login'
											});
										}
									}
								});
							} else {
								// 其他错误
								uni.showToast({
									title: '添加失败，请稍后再试',
									icon: 'none',
									duration: 1500
								});
							}
						});
					} catch (error) {
						console.error('处理价格时出错:', error);
						uni.showToast({
							title: '处理商品数据出错，请到详情页重试',
							icon: 'none',
							duration: 1500
						});
						setTimeout(() => {
							this.navToDetailPage(item);
						}, 1500);
					}
				}).catch(error => {
					// 清除超时
					clearTimeout(timeout);
					uni.hideLoading();
					console.error('获取SKU信息失败:', error);
					uni.showToast({
						title: '获取商品规格失败，请到详情页重试',
						icon: 'none',
						duration: 1500
					});
					setTimeout(() => {
						this.navToDetailPage(item);
					}, 1500);
				});
			},
			// 获取用户位置
			getUserLocation() {
				// 先检查本地存储是否有位置信息
				const savedLocation = uni.getStorageSync('userLocation');
				if (savedLocation) {
					console.log('使用本地存储的位置信息:', savedLocation);
					this.location = savedLocation;
					return;
				}
				
				uni.getLocation({
					type: 'gcj02',
					success: res => {
						console.log('定位成功:', res);
						this.reverseGeocode(res.latitude, res.longitude);
					},
					fail: err => {
						console.error('定位失败:', err);
						this.location.name = '无法获取位置';
					}
				});
			},
			
			// 根据经纬度获取位置名称
			reverseGeocode(latitude, longitude) {
				// 使用uni-app提供的接口进行反向地理编码
				uni.request({
					url: `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=您的腾讯地图密钥`,  // 需要替换为真实的地图API密钥
					success: res => {
						if (res.statusCode === 200 && res.data.status === 0) {
							// 提取位置信息
							const result = res.data.result;
							this.location = {
								name: result.address_component.district,
								fullAddress: result.address,
								latitude,
								longitude
							};
							console.log('位置解析成功:', this.location);
							
							// 存储位置信息到本地
							uni.setStorageSync('userLocation', this.location);
						} else {
							console.error('位置解析失败:', res);
							this.location.name = '位置解析失败';
						}
					},
					fail: err => {
						console.error('请求地址解析失败:', err);
						this.location.name = '位置解析失败';
					}
				});
			},
			
			// 打开位置选择器
			chooseLocation() {
				uni.chooseLocation({
					success: res => {
						console.log('选择位置成功:', res);
						this.location = {
							name: res.name,
							fullAddress: res.address,
							latitude: res.latitude,
							longitude: res.longitude
						};
						
						// 存储位置信息到本地
						uni.setStorageSync('userLocation', this.location);
					},
					fail: err => {
						console.error('选择位置失败:', err);
					}
				});
			},
			
			// 搜索框点击事件处理
			toSearch() {
				console.log('搜索框被点击，准备跳转到搜索页面');
				// 搜索页面是tabBar页面，应使用switchTab
				uni.switchTab({
					url: '/pages/index/search',
					success: function() {
						console.log('跳转到搜索页面成功');
					},
					fail: function(err) {
						console.error('跳转到搜索页面失败:', err);
						// 如果switchTab失败，尝试navigateTo
						uni.navigateTo({
							url: '/pages/index/search'
						});
					}
				});
			},
		},
		// 标题栏input搜索框点击
		onNavigationBarSearchInputClicked(e) {
		 	console.log('点击了导航栏搜索框，准备跳转到搜索页面');
		    uni.switchTab({
		    	url: '/pages/index/search',
				success: function() {
					console.log('导航栏搜索框：跳转到搜索页面成功');
				},
				fail: function(err) {
					console.error('导航栏搜索框：跳转到搜索页面失败:', err);
					// 如果switchTab失败，尝试navigateTo
					uni.navigateTo({
						url: '/pages/index/search'
					});
				}
		    });
		},
		//点击导航栏 buttons 时触发
		onNavigationBarButtonTap(e) {
			const index = e.index;
			if (index === 0) {
				this.$api.msg('点击了扫描');
				uni.navigateTo({
					url: '/pages/index/search'
				})
			} else if (index === 1) {
				// #ifdef APP-PLUS
				const pages = getCurrentPages();
				const page = pages[pages.length - 1];
				const currentWebview = page.$getAppWebview();
				currentWebview.hideTitleNViewButtonRedDot({
					index
				});
				// #endif
				uni.navigateTo({
					url: '/pages/notice/notice'
				})
			}
		}
	
	}
</script>

<style lang="scss">
	/* CSS变量定义，用于不同平台适配 */
	page {
		--status-bar-height: 0;
		
		/* #ifdef APP-PLUS */
		--status-bar-height: var(--window-top);
		/* #endif */
		
		/* #ifdef MP */
		--status-bar-height: 25px;
		/* #endif */
		
		--safe-area-inset-top: 0;
		--safe-area-inset-bottom: 0;
		
		/* #ifdef APP-PLUS */
		--safe-area-inset-top: env(safe-area-inset-top);
		--safe-area-inset-bottom: env(safe-area-inset-bottom);
		/* #endif */
	}
	
	.carousel-section {
		/* 轮播图区域高度调整 */
		position: relative;
		padding-top: var(--status-bar-height);
		
		.titleNview-placing {
			height: var(--status-bar-height);
			padding-top: 44px; /* 导航栏固定高度 */
			box-sizing: content-box;
		}
		
		.titleNview-background {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 426upx;
			transition: .4s;
			box-shadow: 0 8upx 30upx rgba(0, 0, 0, 0.4);
		}

		/* 确保轮播图区域有足够空间 */
		.carousel {
			width: 100%;
			height: 350upx;
			margin-bottom: 0;
			
			.carousel-item {
				width: 100%;
				height: 100%;
				padding: 0;
				overflow: hidden;
			}

			image {
				width: 100%;
				height: 100%;
				border-radius: 0;
				box-shadow: 0 5upx 25upx rgba(0, 0, 0, 0.3);
				object-fit: cover;
				transform: translateY(0);
			}
		}
	}

	/* #ifdef MP */
	.mp-search-box {
		position: fixed;
		top: 0;
		z-index: 9999;
		width: 100%;
		background-color: #fff;
		padding: 0 0 20upx 0;
		
		.ser-input {
			flex: 1;
			height: 56upx;
			line-height: 56upx;
			text-align: center;
			font-size: 28upx;
			color: $font-color-base;
			border-radius: 20px;
			background: rgba(255, 255, 255, .6);
			margin: 0 30upx;
		}
	}

	page {
		background: #f5f5f5;
		width: 100%;
		overflow-x: hidden;
	}
	
	.container {
		width: 100%;
		overflow-x: hidden;
	}

	.m-t {
		margin-top: 16upx;
	}

	.swiper-dots {
		display: flex;
		position: absolute;
		left: 45upx;
		bottom: 40upx;
		width: 72upx;
		height: 36upx;
		background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDhn8LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTMyIDc5LjE1OTI4NCwgMjAxNi8wNC8xOS0xMzoxMzo0MCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OTk4MzlBNjE0NjU1MTFFOUExNjRFQ0I3RTQ0NEExQjMiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OTk4MzlBNjA0NjU1MTFFOUExNjRFQ0I3RTQ0NEExQjMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6Q0E3RUNERkE0NjExMTFFOTg5NzI4MTM2Rjg0OUQwOEUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6Q0E3RUNERkI0NjExMTFFOTg5NzI4MTM2Rjg0OUQwOEUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4Gh5BPAAACTUlEQVR42uzcQW7jQAwFUdN306l1uWwNww5kqdsmm6/2MwtVCp8CosQtP9vg/2+/gY+DRAMBgqnjIp2PaCxCLLldpPARRIiFj1yBbMV+cHZh9PURRLQNhY8kgWyL/WDtwujjI8hoE8rKLqb5CDJaRMJHokC6yKgSCR9JAukmokIknCQJpLOIrJFwMsBJELFcKHwM9BFkLBMKFxNcBCHlQ+FhoocgpVwwnv0Xn30QBJGMC0QcaBVJiAMiec/dcwKuL4j1QMsVCXFAJE4s4NQA3K/8Y6DzO4g40P7UcmIBJxbEesCKWBDg8wWxHrAiFgT4fEGsB/CwIhYE+AeBAAdPLOcV8HRmWRDAiQVcO7GcV8CLM8uCAE4sQCDAlHcQ7x+ABQEEAggEEAggEEAggEAAgQACASAQQCCAQACBAAIBBAIIBBAIIBBAIABe4e9iAe/xd7EAJxYgEGDeO4j3EODp/cOCAE4sYMyJ5cwCHs4rCwI4sYBxJ5YzC84rCwKcXxArAuthQYDzC2JF0H49LAhwYUGsCFqvx5EF2T07dMaJBetx4cRyaqFtHJ8EIhK0i8OJBQxcECuCVutxJhCRoE0cZwMRyRcFefa/ffZBVPogePihhyCnbBhcfMFFEFM+DD4m+ghSlgmDkwlOgpAl4+BkkJMgZdk4+EgaSCcpVX7bmY9kgXQQU+1TgE0c+QJZUUz1b2T4SBbIKmJW+3iMj2SBVBWz+leVfCQLpIqYbp8b85EskIxyfIOfK5Sf+wiCRJEsllQ+oqEkQfBxmD8BBgA5hVjXyrBNUQAAAABJRU5ErkJggg==);
		background-size: 100% 100%;

		.num {
			width: 36upx;
			height: 36upx;
			border-radius: 50px;
			font-size: 24upx;
			color: #fff;
			text-align: center;
			line-height: 36upx;
		}

		.sign {
			position: absolute;
			top: 0;
			left: 50%;
			line-height: 36upx;
			font-size: 12upx;
			color: #fff;
			transform: translateX(-50%);
		}
	}

	.ad-1 {
		width: 100%;
		height: 210upx;
		padding: 10upx 0;
		background: #fff;

		image {
			width: 100%;
			height: 100%;
		}
	}

	/* 秒杀专区 */
	.seckill-section {
		padding: 4upx 30upx 24upx;
		background: #fff;
		width: 100%;
		box-sizing: border-box;

		.s-header {
			display: flex;
			align-items: center;
			height: 92upx;
			line-height: 1;

			.s-img {
				width: 140upx;
				height: 30upx;
			}

			.tip {
				font-size: $font-base;
				color: $font-color-light;
				margin: 0 20upx 0 40upx;
			}

			.timer {
				display: inline-block;
				width: 40upx;
				height: 36upx;
				text-align: center;
				line-height: 36upx;
				margin-right: 14upx;
				font-size: $font-sm+2upx;
				color: #fff;
				border-radius: 2px;
				background: rgba(0, 0, 0, .8);
			}

			.icon-you {
				font-size: $font-lg;
				color: $font-color-light;
				flex: 1;
				text-align: right;
			}
		}

		.floor-list {
			white-space: nowrap;
		}

		.scoll-wrapper {
			display: flex;
			align-items: flex-start;
		}

		.floor-item {
			width: 300upx;
			margin-right: 20upx;
			font-size: $font-sm+2upx;
			color: $font-color-dark;
			line-height: 1.8;
			background-color: #fff;
			border-radius: 12upx;
			box-shadow: 0 5upx 25upx rgba(0, 0, 0, 0.1);
			padding: 15upx;
			display: flex;
			flex-direction: column;
			align-items: center;
			
			&:last-child {
				margin-right: 0;
			}

			image {
				width: 270upx;
				height: 270upx;
				border-radius: 8upx;
				margin-bottom: 10upx;
			}

			.title {
				width: 100%;
				font-size: $font-lg;
				color: $font-color-dark;
				line-height: 40upx;
				padding: 0 8upx;
				white-space: nowrap;
				text-overflow: ellipsis;
				overflow: hidden;
				height: 40upx;
			}

			.title2 {
				width: 100%;
				font-size: $font-sm;
				color: $font-color-light;
				line-height: 36upx;
				padding: 0 8upx;
				white-space: nowrap;
				text-overflow: ellipsis;
				overflow: hidden;
				height: 36upx;
			}

			.price-box {
				width: 100%;
				padding: 10upx 8upx;
				margin-top: 5upx;
				display: flex;
				align-items: center;
				justify-content: flex-end;
				
				.price {
					color: #f04c41;
					font-size: $font-lg;
					line-height: 1;
					margin-right: 8upx;
				}
				
				.price-original {
					color: $uni-color-primary;
					font-size: $font-sm + 2upx;
					text-decoration: line-through;
				}
				
				.cart-box {
					margin-left: auto;
					position: relative;
					
					.iconfont {
						font-size: 40upx;  /* 统一购物车图标大小 */
						color: $uni-color-primary;
					}
				}
			}

			.price {
				width: 100%;
				color: $uni-color-primary;
				padding: 10upx 8upx;
				margin-top: 5upx;
			}
		}
	}

	.f-header {
		display: flex;
		align-items: center;
		height: 140upx;
		padding: 6upx 30upx 8upx 30upx;
		background: #fff;
		width: 100%;
		box-sizing: border-box;

		image {
			flex-shrink: 0;
			width: 80upx;
			height: 80upx;
			margin-right: 20upx;
		}

		.tit-box {
			flex: 1;
			display: flex;
			flex-direction: column;
		}
			
		.tit {
			font-size: $font-lg +2upx;
			color: $font-color-dark;
			line-height: 1.3;
		}
			
		.tit2 {
			font-size: $font-sm;
			color: $font-color-light;
		}
			
		.icon-you {
			font-size: $font-lg +2upx;
			color: $font-color-light;
		}
		
		.timer {
			display: inline-block;
			width: 40upx;
			height: 36upx;
			text-align: center;
			line-height: 36upx;
			margin-right: 14upx;
			font-size: $font-sm+2upx;
			color: #fff;
			border-radius: 2px;
			background: rgba(0, 0, 0, .8);
		}
	}

	.header {
		display: flex;
		flex-direction: column;
		padding: 20upx 0;
		background-color: #fff;
		position: relative;
		z-index: 10;
		
		.search-box {
			width: 100%;
			
			.ser-input {
				flex:1;
				height:56upx;
				line-height:56upx;
				text-align: center;
				font-size:28upx;
				color:$font-color-base;
				border-radius:20px;
				background: #f5f5f5;
				margin:0 30upx;
			}
		}
	}

	/* 分类推荐楼层 */
	.hot-section {
		display: flex;
		flex-wrap: wrap;
		padding: 0 30upx;
		background: #fff;
		width: 100%;
		box-sizing: border-box;

		.guess-item {
			display: flex;
			flex-direction: row;
			width: 100%;
			padding: 15upx;
			margin-bottom: 20upx;
			border-radius: 12upx;
			background-color: #fff;
			box-shadow: 0 5upx 25upx rgba(0, 0, 0, 0.1);
		}

		.image-wrapper {
			width: 30%;
			height: 250upx;
			border-radius: 8upx;
			overflow: hidden;

			image {
				width: 100%;
				height: 100%;
				opacity: 1;
			}
		}

		.title {
			font-size: $font-lg;
			color: $font-color-dark;
			line-height: 60upx;
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;
			height: 60upx;
		}

		.title2 {
			font-size: $font-sm;
			color: $font-color-light;
			line-height: 40upx;
			height: 80upx;
			overflow: hidden;
			text-overflow: ellipsis;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
		}

		.price-box {
			width: 100%;
			display: flex;
			align-items: center;
			justify-content: flex-end;
			
			.price {
				color: #f04c41;
				font-size: $font-lg;
				line-height: 1;
				margin-right: 8upx;
			}
			
			.price-original {
				color: $uni-color-primary;
				font-size: $font-sm + 2upx;
				text-decoration: line-through;
			}
			
			.cart-box {
				margin-left: auto;
				position: relative;
				
				.iconfont {
					font-size: 40upx;  /* 统一购物车图标大小 */
					color: $uni-color-primary;
				}
			}
		}

		.txt {
			width: 70%;
			display: flex;
			flex-direction: column;
			padding-left: 30upx;
			justify-content: space-between;
		}
	}

	/* 猜你喜欢 */
	.guess-section {
		display: flex;
		flex-wrap: wrap;
		padding: 0 30upx;
		background: #fff;
		width: 100%;
		box-sizing: border-box;
	}
	
	.guess-section .guess-item {
		display: flex;
		flex-direction: column;
		width: 48%;
		padding: 15upx;
		margin-bottom: 20upx;
		border-radius: 12upx;
		background-color: #fff;
		box-shadow: 0 5upx 25upx rgba(0, 0, 0, 0.1);
	}
	
	.guess-section .guess-item:nth-child(2n+1) {
		margin-right: 4%;
	}
	
	.guess-section .image-wrapper {
		width: 100%;
		height: 330upx;
		border-radius: 8upx;
		overflow: hidden;
		margin-bottom: 10upx;
	}
	
	.guess-section .image-wrapper image {
		width: 100%;
		height: 100%;
		opacity: 1;
	}
	
	.guess-section .image-wrapper-brand {
		width: 100%;
		height: 150upx;
		border-radius: 3px;
		overflow: hidden;
	}
	
	.guess-section .image-wrapper-brand image {
		width: 100%;
		height: 100%;
		opacity: 1;
	}
	
	.guess-section .title {
		font-size: $font-lg;
		color: $font-color-dark;
		line-height: 80upx;
		padding: 0 8upx;
	}
	
	.guess-section .title2 {
		font-size: $font-sm;
		color: $font-color-light;
		line-height: 40upx;
		padding: 0 8upx;
	}
	
	.guess-section .price-box {
		width: 100%;
		padding: 10upx 8upx;
		margin-top: 5upx;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		
		.price {
			color: #f04c41;
			font-size: $font-lg;
			line-height: 1;
			margin-right: 8upx;
		}
		
		.price-original {
			color: $uni-color-primary;
			font-size: $font-sm + 2upx;
			text-decoration: line-through;
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

	/* 统一所有区域的购物车徽标样式 */
	.seckill-section .cart-box,
	.hot-section .cart-box,
	.guess-section .cart-box {
		position: absolute;
		top: -8upx;
		right: -8upx;
		color: #fff;
		font-size: 20upx;
		line-height: 1;
		padding: 4upx 8upx;
		border-radius: 10upx;
		min-width: 30upx;
		height: 30upx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* 位置信息展示区 */
	.location-section {
		padding: 0;
		background: #fff;
		position: relative;
		margin-top: 10upx;
		
		.location-inner {
			display: flex;
			align-items: center;
			height: 80upx;
			padding: 0 30upx;
			background: linear-gradient(to right, #f8f8f8, #f2f2f2);
			border-radius: 0;
			margin: 0;
			width: 100%;
			box-sizing: border-box;
			box-shadow: 0 2upx 10upx rgba(0, 0, 0, 0.1);
			
			.yticon {
				font-size: 38upx;
				color: #286090;
				margin-right: 10upx;
			}
			
			.location-icon {
				color: #f04c41;
				font-size: 32upx;
				margin-right: 10upx;
			}
			
			.location-text {
				flex: 1;
				font-size: 28upx;
				color: #333;
				margin-right: 10upx;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				font-weight: bold;
			}
			
			.location-tips {
				font-size: 24upx;
				color: #666;
				position: relative;
				padding-left: 15upx;
				
				&:before {
					content: '';
					position: absolute;
					left: 0;
					top: 50%;
					transform: translateY(-50%);
					width: 1px;
					height: 20upx;
					background: #ddd;
				}
			}
			
			&:active {
				background: linear-gradient(to right, #f0f0f0, #e8e8e8);
				transform: scale(0.98);
				transition: all 0.2s;
			}
		}
		
		&:after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 1px;
			background: #eee;
		}
	}

	/* 通用搜索框样式 */
	.common-search-box {
		padding: 15upx 30upx;
		background: #fff;
		
		.search-box-input {
			height: 70upx;
			background: #f5f5f5;
			border-radius: 35upx;
			display: flex;
			align-items: center;
			padding: 0 30upx;
			
			.yticon {
				font-size: 30upx;
				color: #286090;
				margin-right: 10upx;
			}
			
			.placeholder {
				font-size: 28upx;
				color: #909399;
			}
		}
	}
</style>

<template>
	<view class="container">
		<!-- 小程序头部兼容 -->
		<!-- #ifdef MP -->
		<view class="mp-search-box">
			<input class="ser-input" type="text" value="输入关键字搜索" disabled />
		</view>
		<!-- #endif -->

		<!-- 头部轮播 -->
		<view class="carousel-section">
			<!-- 标题栏和状态栏占位符 -->
			<view class="titleNview-placing"></view>
			<!-- 背景色区域 -->
			<view class="titleNview-background" :style="{backgroundColor:titleNViewBackground}"></view>
			<swiper class="carousel" circular @change="swiperChange">
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
		<!-- 头部功能区 -->
		<view class="cate-section">
			<view class="cate-item">
				<image src="/static/temp/c3.png"></image>
				<text>专题</text>
			</view>
			<view class="cate-item">
				<image src="/static/temp/c5.png"></image>
				<text>话题</text>
			</view>
			<view class="cate-item">
				<image src="/static/temp/c6.png"></image>
				<text>优选</text>
			</view>
			<view class="cate-item">
				<image src="/static/temp/c7.png"></image>
				<text>特惠</text>
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
				<text class="price">￥{{item.price}}</text>
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
						<text class="price">￥{{item.price}}</text>
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
					<text class="price">￥{{item.price}}</text>
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
				<text class="price">￥{{item.price}}</text>
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
	export default {
		components: {
			uniLoadMore	
		},
		data() {
			return {
				titleNViewBackground: '',
				titleNViewBackgroundList: ['rgb(45, 70, 20)', 'rgb(45, 70, 20)'],
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
			};
		},
		onLoad() {
			console.log('started on load.');
			this.loadData();
		},
		updated() {
			console.log('Data loaded');
			if (this.homeFlashPromotion && this.homeFlashPromotion.endTime) {
				console.log('endtime:', this.homeFlashPromotion.endTime);
				this.startCountdown();
				console.log('homeFlashPromotion:', this.homeFlashPromotion);
			} else {
				console.warn('Flash promotion data not loaded yet.');
				console.log('homeFlashPromotion:', this.homeFlashPromotion); // 检查是否有数据
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
			        uni.stopPullDownRefresh();
					console.log('API response:', response); // 检查API返回的内容
			    } catch (error) {
			        console.error('Error in loadData:', error);
			    }
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
				if (this.firstFlag == true) {
					console.log('firstFlag is', this.firstFlag);
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
			}
		},
		// 标题栏input搜索框点击
		onNavigationBarSearchInputClicked(e) {
		 	this.$api.msg('点击了搜索框');
		    uni.navigateTo({
		    	url: '/pages/index/search'
		    })
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
	/* #ifdef MP */
	.mp-search-box {
		position: absolute;
		left: 0;
		top: 30upx;
		z-index: 9999;
		width: 100%;
		padding: 0 80upx;

		.ser-input {
			flex: 1;
			height: 56upx;
			line-height: 56upx;
			text-align: center;
			font-size: 28upx;
			color: $font-color-base;
			border-radius: 20px;
			background: rgba(255, 255, 255, .6);
		}
	}

	page {
		.cate-section {
			position: relative;
			z-index: 5;
			border-radius: 16upx 16upx 0 0;
			margin-top: -20upx;
		}

		.carousel-section {
			padding: 0;

			.titleNview-placing {
				padding-top: 0;
				height: 0;
			}

			.carousel {
				.carousel-item {
					padding: 0;
				}
			}

			.swiper-dots {
				left: 45upx;
				bottom: 40upx;
			}
		}
	}

	/* #endif */


	page {
		background: #f5f5f5;
	}

	.m-t {
		margin-top: 16upx;
	}

	/* 头部 轮播图 */
	.carousel-section {
		position: relative;
		padding-top: 10px;

		.titleNview-placing {
			height: var(--status-bar-height);
			padding-top: 44px;
			box-sizing: content-box;
		}

		.titleNview-background {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 426upx;
			transition: .4s;
		}
	}

	.carousel {
		width: 100%;
		height: 350upx;

		.carousel-item {
			width: 100%;
			height: 100%;
			padding: 0 28upx;
			overflow: hidden;
		}

		image {
			width: 100%;
			height: 100%;
			border-radius: 10upx;
		}
	}

	.swiper-dots {
		display: flex;
		position: absolute;
		left: 60upx;
		bottom: 15upx;
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

	/* 分类 */
	.cate-section {
		display: flex;
		justify-content: space-around;
		align-items: center;
		flex-wrap: wrap;
		padding: 30upx 22upx;
		background: #fff;

		.cate-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			font-size: $font-sm + 2upx;
			color: $font-color-dark;
		}

		/* 原图标颜色太深,不想改图了,所以加了透明度 */
		image {
			width: 88upx;
			height: 88upx;
			margin-bottom: 14upx;
			border-radius: 50%;
			opacity: .7;
			box-shadow: 4upx 4upx 20upx rgba(250, 67, 106, 0.3);
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
		padding: 6upx 30upx 8upx;
		background: #fff;

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

	/* 分类推荐楼层 */
	.hot-section {
		display: flex;
		flex-wrap: wrap;
		padding: 0 30upx;
		background: #fff;

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

		.price {
			font-size: $font-lg;
			color: $uni-color-primary;
			line-height: 60upx;
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
	
	.guess-section .price {
		font-size: $font-lg;
		color: $uni-color-primary;
		line-height: 1;
		padding: 10upx 8upx;
	}
</style>

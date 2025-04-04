<template>
	<view class="content">
		<view class="navbar">
			<view v-for="(item, index) in navList" :key="index" class="nav-item" :class="{current: tabCurrentIndex === index}"
			 @click="tabClick(index)">
				{{item.text}}
			</view>
		</view>

		<swiper :current="tabCurrentIndex" class="swiper-box" duration="300" @change="changeTab">
			<swiper-item class="tab-content" v-for="(tabItem,tabIndex) in navList" :key="tabIndex">
				<scroll-view class="list-scroll-content" scroll-y @scrolltolower="loadData('add')">
					<!-- 空白页 -->
					<empty v-if="afterSaleList==null||afterSaleList.length === 0"></empty>

					<!-- 售后列表 -->
					<view v-for="(item,index) in afterSaleList" :key="index" class="after-sale-item">
						<view class="i-top b-b">
							<text class="time">{{item.createTime | formatDateTime}}</text>
							<text class="state" :style="{color: item.status === 0 ? '#fa436a' : '#999'}">{{item.status | formatStatus}}</text>
						</view>
						
						<!-- 售后服务ID信息 -->
						<view class="service-id-info">
							<text class="service-id-text">售后服务编号:{{item.id}}</text>
						</view>
						<!-- 待处理状态时显示订单信息 -->
						<view class="service-id-info" v-if="item.status === 0">
							<!-- 检查多种可能的订单号位置 -->
							<text class="service-id-text">{{getOrderSn(item)}}</text>
							<text class="order-info-debug" v-if="!getOrderSn(item) && isDebug">数据结构: {{JSON.stringify(item).substring(0, 100)}}...</text>
						</view>
						
						<!-- 售后原因信息 -->
						<view class="reason-info">
							<text class="reason-label">售后原因: </text>
							<view class="reason-content-wrapper">
								<text class="reason-content" v-if="!item.isReasonExpanded && item.reason && item.reason.length > 30">{{item.reason.substring(0, 30)}}...</text>
								<text class="reason-content" v-else>{{item.reason || '无'}}</text>
								<text class="expand-btn" v-if="item.reason && item.reason.length > 30" @click="toggleReasonExpand(item)">
									{{item.isReasonExpanded ? '收起' : '展开'}}
								</text>
							</view>
						</view>
						
						<!-- 凭证图片 -->
						<view class="pics-info" v-if="hasPics(item)">
							<text class="pics-label">凭证图片:</text>
							<scroll-view class="pics-scroll" scroll-x="true" show-scrollbar="false">
								<view class="pics-container">
									<view class="pic-item" v-for="(pic, picIndex) in formatPics(item.pics)" :key="picIndex" @click="previewImage(pic, formatPics(item.pics))">
										<image class="thumbnail" :src="pic" mode="aspectFill" 
											@error="onImageError(item, picIndex)" 
											@load="onImageLoad(item, picIndex)" 
											:lazy-load="true">
										</image>
										<view class="loading-placeholder" v-if="isImageLoading(item, picIndex)">
											<text class="cuIcon-loading2"></text>
										</view>
										<view class="error-placeholder" v-if="hasImageError(item, picIndex)">
											<text class="error-icon">!</text>
										</view>
										<view class="pic-count" v-if="picIndex === 0 && formatPics(item.pics).length > 1">
											{{formatPics(item.pics).length}}张
										</view>
									</view>
								</view>
							</scroll-view>
							<view class="debug-info" v-if="isDebug">
								<text>原始数据: {{item.pics && item.pics.substring ? (item.pics.length > 50 ? item.pics.substring(0, 50) + '...' : item.pics) : JSON.stringify(item.pics)}}</text>
								<view class="debug-url" v-if="formatPics(item.pics).length > 0">
									<text>图片URL: {{formatPics(item.pics)[0]}}</text>
								</view>
							</view>
						</view>
						
						<view class="goods-box-single" v-for="(orderItem, itemIndex) in item.orderItemList" :key="itemIndex">
							<image class="goods-img" :src="orderItem.productPic" mode="aspectFill"></image>
							<view class="right">
								<text class="title clamp">{{orderItem.productName}}</text>
								<text class="attr-box">{{orderItem.productAttr | formatProductAttr}} x {{orderItem.productQuantity}}</text>
								<text class="price">{{orderItem.productPrice}}</text>
								<!-- 待处理状态时显示商品条目编号 -->
								<text class="item-info" v-if="item.status === 0">商品条目编号: {{orderItem.id || '无'}}</text>
							</view>
						</view>

						<view class="price-box">
							共
							<text class="num">{{calcTotalQuantity(item)}}</text>
							件商品 实付款
							<text class="price">{{item.payAmount}}</text>
						</view>

						<view class="action-section" v-if="item.status === 0">
							<button class="action-btn cancel" @click.stop="cancelAfterSale(item.id)">取消申请</button>
						</view>
						<view class="action-section" v-else>
							<button class="action-btn detail" @click.stop="viewAfterSaleDetail(item.id)">查看详情</button>
						</view>
					</view>

					<uni-load-more :status="loadingType"></uni-load-more>
				</scroll-view>
			</swiper-item>
		</swiper>
	</view>
</template>

<script>
	import uniLoadMore from '@/components/uni-load-more/uni-load-more.vue';
	import empty from "@/components/empty";
	import {
		formatDate
	} from '@/utils/date';
	import {
		fetchAfterSaleList
	} from '@/api/afterSale.js';
	import {
		API_BASE_URL
	} from '@/utils/appConfig.js';

	export default {
		components: {
			uniLoadMore,
			empty
		},
		data() {
			return {
				tabCurrentIndex: 0,
				afterSaleParam: {
					status: -1,
					pageNum: 1,
					pageSize: 5
				},
				afterSaleList: [],
				loadingType: 'more',
				navList: [{
						state: -1,
						text: '全部'
					},
					{
						state: 0,
						text: '待处理'
					},
					{
						state: 1,
						text: '处理中'
					},
					{
						state: 2,
						text: '已完成'
					},
					{
						state: 3,
						text: '已拒绝'
					}
				],
				isDebug: false, // 调试模式标志
				imageErrors: {}, // 记录图片加载错误
				imageLoading: {}, // 记录图片加载状态
				debugInfo: {} // 存储调试信息
			};
		},
		onLoad(options) {
			this.tabCurrentIndex = +options.state || 0;
			this.loadData();
		},
		filters: {
			formatStatus(status) {
				let statusTip = '';
				switch (+status) {
					case 0:
						statusTip = '待处理';
						break;
					case 1:
						statusTip = '处理中';
						break;
					case 2:
						statusTip = '已完成';
						break;
					case 3:
						statusTip = '已拒绝';
						break;
				}
				return statusTip;
			},
			formatProductAttr(jsonAttr) {
				let attrArr = JSON.parse(jsonAttr);
				let attrStr = '';
				for (let attr of attrArr) {
					attrStr += attr.key;
					attrStr += ":";
					attrStr += attr.value;
					attrStr += ";";
				}
				return attrStr
			},
			formatDateTime(time) {
				if (time == null || time === '') {
					return 'N/A';
				}
				let date = new Date(time);
				return formatDate(date, 'yyyy-MM-dd hh:mm:ss')
			},
		},
		methods: {
			// 检查是否有凭证图片
			hasPics(item) {
				return item.pics && (
					(typeof item.pics === 'string' && item.pics.trim() !== '') ||
					(Array.isArray(item.pics) && item.pics.length > 0) ||
					(typeof item.pics === 'object' && item.pics !== null)
				);
			},
			
			// 检查图片是否正在加载
			isImageLoading(item, index) {
				if (!item || !item.id) return false;
				if (!this.imageLoading[item.id]) {
					this.$set(this.imageLoading, item.id, {});
					this.$set(this.imageLoading[item.id], index, true);
					return true;
				}
				return !!this.imageLoading[item.id][index];
			},
			
			// 图片加载错误处理
			onImageError(item, index) {
				console.error('图片加载失败:', this.formatPics(item.pics)[index]);
				// 记录错误状态便于UI处理
				if (!this.imageErrors[item.id]) {
					this.$set(this.imageErrors, item.id, {});
				}
				this.$set(this.imageErrors[item.id], index, true);
				
				// 设置加载状态为完成
				if (this.imageLoading[item.id]) {
					this.$set(this.imageLoading[item.id], index, false);
				}
			},
			
			// 图片加载完成处理
			onImageLoad(item, index) {
				if (!item || !item.id) return;
				if (this.imageLoading[item.id]) {
					this.$set(this.imageLoading[item.id], index, false);
				}
			},
			
			// 获取基础URL
			getBaseUrl() {
				// 使用全局配置的API基础URL作为图片服务器地址
				// 这样可以确保图片URL与API地址一致，避免硬编码
				return API_BASE_URL;
			},
			
			// 格式化并修复图片路径
			fixImagePath(path) {
				if (!path) return '';
				
				// 已经是完整URL
				if (path.startsWith('http')) {
					return path;
				}
				
				// 相对路径，添加基础URL
				if (path.startsWith('/')) {
					return this.getBaseUrl() + path;
				}
				
				// 其他情况，假设是相对路径
				return this.getBaseUrl() + '/' + path;
			},
			
			// 格式化凭证图片列表
			formatPics(picsStr) {
				if (!picsStr) return [];
				
				// 调试输出原始数据
				if (this.isDebug) {
					console.log('原始凭证图片数据:', picsStr, '类型:', typeof picsStr);
				}
				
				// 已经是数组，确保每个URL都是完整的
				if (Array.isArray(picsStr)) {
					return picsStr.map(url => this.fixImagePath(url));
				}
				
				try {
					// 处理字符串类型
					if (typeof picsStr === 'string') {
						// 直接处理逗号分隔的图片地址 - 最常见的情况
						if (picsStr.includes(',')) {
							const urls = picsStr.split(',')
								.map(url => url.trim())
								.filter(url => url)
								.map(url => this.fixImagePath(url));
								
							if (this.isDebug) {
								console.log('处理后的图片URL列表:', urls);
							}
							
							return urls;
						}
						
						// 如果是单个URL
						if (picsStr.includes('/upload/') || picsStr.startsWith('/')) {
							const url = this.fixImagePath(picsStr);
							if (this.isDebug) {
								console.log('处理后的单个URL:', url);
							}
							return [url];
						}
						
						// 尝试解析JSON
						if (picsStr.startsWith('[') || picsStr.startsWith('{')) {
							try {
								const parsed = JSON.parse(picsStr);
								if (Array.isArray(parsed)) {
									return parsed.map(url => this.fixImagePath(url));
								} else if (typeof parsed === 'object' && parsed !== null) {
									// 尝试从对象中提取URL
									for (const key of ['url', 'src', 'path']) {
										if (parsed[key]) {
											return [this.fixImagePath(parsed[key])];
										}
									}
								}
							} catch (e) {
								console.error('JSON解析失败:', e);
							}
						}
						
						// 作为单个URL处理
						return [this.fixImagePath(picsStr)];
					}
					
					// 处理对象类型
					if (typeof picsStr === 'object' && picsStr !== null) {
						for (const key of ['url', 'src', 'path', 'pics']) {
							if (picsStr[key]) {
								if (Array.isArray(picsStr[key])) {
									return picsStr[key].map(url => this.fixImagePath(url));
								}
								return [this.fixImagePath(picsStr[key])];
							}
						}
					}
					
					// 转换为字符串
					return [this.fixImagePath(String(picsStr))];
					
				} catch (e) {
					console.error('解析凭证图片出错:', e);
					return [];
				}
			},
			
			// 预览图片
			previewImage(current, urls) {
				uni.previewImage({
					current: current, // 当前显示图片的链接
					urls: urls, // 所有图片的链接列表
					indicator: 'number',
					loop: true
				});
			},
			// 切换原因展开/收起状态
			toggleReasonExpand(item) {
				// 使用Vue.set确保响应式更新
				if(typeof item.isReasonExpanded === 'undefined') {
					this.$set(item, 'isReasonExpanded', true);
				} else {
					item.isReasonExpanded = !item.isReasonExpanded;
				}
			},
			// 获取订单编号，考虑各种可能的数据结构
			getOrderSn(item) {
				if (item.orderSn) {
					return item.orderSn;
				} else if (item.order && item.order.orderSn) {
					return item.order.orderSn;
				} else if (item.orderId) {
					return '订单编号: ' + item.orderId;
				} else if (item.order && item.order.id) {
					return '订单编号: ' + item.order.id;
				} else {
					return '无订单信息';
				}
			},
			//获取售后列表
			loadData(type='refresh') {
				if(type=='refresh'){
					this.afterSaleParam.pageNum=1;
				}else{
					this.afterSaleParam.pageNum++;
				}
				let index = this.tabCurrentIndex;
				let navItem = this.navList[index];
				if (this.loadingType === 'loading') {
					return;
				}
				this.afterSaleParam.status = navItem.state;
				this.loadingType = 'loading';
				fetchAfterSaleList(this.afterSaleParam).then(response => {
					let list = response.data.list;
					// 打印售后列表数据结构
					if(list && list.length > 0) {
						console.log('售后列表第一项数据结构:', JSON.stringify(list[0]));
					}
					if(type=='refresh'){
						this.afterSaleList = list;
						this.loadingType = 'more';
					}else{
						if(list!=null&&list.length>0){
							this.afterSaleList = this.afterSaleList.concat(list);
							this.loadingType = 'more';
						}else{
							this.afterSaleParam.pageNum--;
							this.loadingType = 'noMore';
						}
					}
				});
			},
			//swiper 切换
			changeTab(e) {
				this.tabCurrentIndex = e.target.current;
				this.loadData();
			},
			//顶部tab点击
			tabClick(index) {
				this.tabCurrentIndex = index;
			},
			//计算商品总数量
			calcTotalQuantity(order){
				let totalQuantity = 0;
				if(order.orderItemList!=null&&order.orderItemList.length>0){
					for(let item of order.orderItemList){
						totalQuantity+=item.productQuantity
					}
				}
				return totalQuantity;
			},
			//查看售后详情
			showAfterSaleDetail(id) {
				uni.navigateTo({
					url: `/pages/afterSale/afterSaleDetail?id=${id}`
				});
			},
			//申请售后
			applyAfterSale(order) {
				uni.navigateTo({
					url: `/pages/afterSale/applyAfterSale?orderId=${order.id}`
				});
			},
			// 检查图片是否加载错误
			hasImageError(item, index) {
				if (!item || !item.id || !this.imageErrors[item.id]) return false;
				return !!this.imageErrors[item.id][index];
			},
			// 查看售后详情
			viewAfterSaleDetail(id) {
				uni.navigateTo({
					url: `/pages/afterSale/afterSaleDetail?id=${id}`
				});
			}
		}
	}
</script>

<style lang="scss">
	page,
	.content {
		background: $page-color-base;
		height: 100%;
	}

	.swiper-box {
		height: calc(100% - 40px);
	}

	.list-scroll-content {
		height: 100%;
	}

	.navbar {
		display: flex;
		height: 40px;
		padding: 0 5px;
		background: #fff;
		box-shadow: 0 1px 5px rgba(0, 0, 0, .06);
		position: relative;
		z-index: 10;

		.nav-item {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;
			font-size: 15px;
			color: $font-color-dark;
			position: relative;

			&.current {
				color: $base-color;

				&:after {
					content: '';
					position: absolute;
					left: 50%;
					bottom: 0;
					transform: translateX(-50%);
					width: 44px;
					height: 0;
					border-bottom: 2px solid $base-color;
				}
			}
		}
	}

	.after-sale-item {
		display: flex;
		flex-direction: column;
		padding-left: 30upx;
		background: #fff;
		margin-top: 16upx;

		.i-top {
			display: flex;
			align-items: center;
			height: 80upx;
			padding-right: 30upx;
			font-size: $font-base;
			color: $font-color-dark;
			position: relative;

			.time {
				flex: 1;
			}

			.state {
				color: $base-color;
			}
		}

		.service-id-info {
			padding: 8upx 30upx;
			font-size: $font-sm + 2upx;
			color: $font-color-light;
			margin: 0 30upx 10upx 0;

			.service-id-text {
				display: block;
				
				.id-value {
					color: #3366cc;
					font-weight: bold;
				}
			}
		}

		.reason-info {
			padding: 10upx 30upx;
			font-size: $font-sm + 2upx;
			color: $font-color-dark;
			margin: 0 30upx 10upx 0;
			background-color: #f9f9f9;
			border-radius: 8upx;
			display: flex;
			flex-wrap: wrap;

			.reason-label {
				color: $font-color-light;
				margin-right: 8upx;
				padding: 4upx 0;
			}
			
			.reason-content-wrapper {
				flex: 1;
				display: flex;
				flex-wrap: wrap;
				word-break: break-all;
			}

			.reason-content {
				flex: 1;
				min-width: 80%;
				padding: 4upx 0;
				word-break: break-all;
				line-height: 1.5;
			}

			.expand-btn {
				color: $base-color;
				font-size: $font-sm;
				padding: 4upx 0;
				margin-left: 8upx;
				background: transparent;
				border: none;
				outline: none;
				cursor: pointer;
			}
		}

		.pics-info {
			padding: 10upx 30upx;
			font-size: $font-sm + 2upx;
			color: $font-color-dark;
			margin: 0 30upx 10upx 0;
			background-color: #f9f9f9;
			border-radius: 8upx;
			
			.pics-label {
				display: block;
				color: $font-color-light;
				margin-bottom: 8upx;
				padding: 4upx 0;
			}
			
			.pics-scroll {
				width: 100%;
				white-space: nowrap;
				height: 160upx;
			}

			.pics-container {
				display: inline-flex;
				padding: 4upx 0;
			}

			.pic-item {
				margin-right: 12upx;
				position: relative;
				border-radius: 6upx;
				overflow: hidden;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
			}

			.thumbnail {
				width: 150upx;
				height: 150upx;
				border-radius: 8upx;
				border: 1px solid #f0f0f0;
				position: relative;
				background-color: #f5f5f5;
				object-fit: cover;
			}
			
			.loading-placeholder {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				display: flex;
				justify-content: center;
				align-items: center;
				background-color: #f0f0f0;
				
				.cuIcon-loading2 {
					font-size: 40upx;
					color: #999;
					animation: rotate 1s linear infinite;
				}
			}
			
			.error-placeholder {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				display: flex;
				justify-content: center;
				align-items: center;
				background-color: #f8f8f8;
				
				.error-icon {
					font-size: 40upx;
					color: #ff6666;
					width: 50upx;
					height: 50upx;
					line-height: 50upx;
					text-align: center;
					border-radius: 50%;
					border: 2upx solid #ff6666;
				}
			}
			
			.pic-count {
				position: absolute;
				right: 0;
				bottom: 0;
				background-color: rgba(0, 0, 0, 0.5);
				color: #fff;
				font-size: 20upx;
				padding: 2upx 8upx;
				border-top-left-radius: 6upx;
			}
			
			.debug-info {
				margin-top: 8upx;
				font-size: 22upx;
				color: #ff6600;
				background-color: #fff9e6;
				padding: 4upx 8upx;
				border-radius: 4upx;
				word-break: break-all;
			}
		}

		.order-info {
			padding: 10upx 30upx 0;
			font-size: $font-sm + 2upx;
			color: $font-color-dark;
			background-color: #f8f8f8;
			margin: 0 30upx 10upx 0;
			border-radius: 8upx;

			.order-info-item {
				display: block;
				padding: 8upx 0;
				border-bottom: 1px dashed #e5e5e5;
			}
			
			.order-info-debug {
				display: block;
				padding: 8upx 0;
				color: #ff6600;
				font-size: 22upx;
				word-break: break-all;
				background-color: #fffbe6;
				margin-top: 4upx;
				border-radius: 4upx;
			}
		}

		.goods-box-single {
			display: flex;
			padding: 20upx 0;

			.goods-img {
				display: block;
				width: 120upx;
				height: 120upx;
			}

			.right {
				flex: 1;
				display: flex;
				flex-direction: column;
				padding: 0 30upx 0 24upx;
				overflow: hidden;

				.title {
					font-size: $font-base + 2upx;
					color: $font-color-dark;
					line-height: 1;
				}

				.attr-box {
					font-size: $font-sm + 2upx;
					color: $font-color-light;
					padding: 10upx 12upx;
				}

				.price {
					font-size: $font-base + 2upx;
					color: $font-color-dark;

					&:before {
						content: '￥';
						font-size: $font-sm;
						margin: 0 2upx 0 8upx;
					}
				}

				.item-info {
					font-size: $font-sm + 2upx;
					color: #3366cc;
					padding: 6upx 0;
					background-color: #f5f7fa;
					display: inline-block;
					margin-top: 6upx;
					border-radius: 4upx;
					padding: 4upx 8upx;
				}
			}
		}

		.price-box {
			display: flex;
			justify-content: flex-end;
			align-items: baseline;
			padding: 20upx 30upx;
			font-size: $font-sm + 2upx;
			color: $font-color-light;

			.num {
				margin: 0 8upx;
				color: $font-color-dark;
			}

			.price {
				font-size: $font-lg;
				color: $font-color-dark;

				&:before {
					content: '￥';
					font-size: $font-sm;
					margin: 0 2upx 0 8upx;
				}
			}
		}

		.action-section {
			margin-top: 20upx;
			display: flex;
			justify-content: flex-end;
			
			.action-btn {
				padding: 10upx 20upx;
				font-size: 24upx;
				border-radius: 30upx;
				margin-left: 20upx;
				
				&.cancel {
					color: #666;
					border: 1px solid #ddd;
					background-color: #fff;
				}
				
				&.detail {
					color: #fa436a;
					border: 1px solid #fa436a;
					background-color: #fff;
				}
			}
		}
	}

	/* load-more */
	.uni-load-more {
		display: flex;
		flex-direction: row;
		height: 80upx;
		align-items: center;
		justify-content: center
	}

	.uni-load-more__text {
		font-size: 28upx;
		color: #999
	}

	.uni-load-more__img {
		height: 24px;
		width: 24px;
		margin-right: 10px
	}

	.uni-load-more__img>view {
		position: absolute
	}

	.uni-load-more__img>view view {
		width: 6px;
		height: 2px;
		border-top-left-radius: 1px;
		border-bottom-left-radius: 1px;
		background: #999;
		position: absolute;
		opacity: .2;
		transform-origin: 50%;
		animation: load 1.56s ease infinite
	}

	.uni-load-more__img>view view:nth-child(1) {
		transform: rotate(90deg);
		top: 2px;
		left: 9px
	}

	.uni-load-more__img>view view:nth-child(2) {
		transform: rotate(180deg);
		top: 11px;
		right: 0
	}

	.uni-load-more__img>view view:nth-child(3) {
		transform: rotate(270deg);
		bottom: 2px;
		left: 9px
	}

	.uni-load-more__img>view view:nth-child(4) {
		top: 11px;
		left: 0
	}

	.load1,
	.load2,
	.load3 {
		height: 24px;
		width: 24px
	}

	.load2 {
		transform: rotate(30deg)
	}

	.load3 {
		transform: rotate(60deg)
	}

	.load1 view:nth-child(1) {
		animation-delay: 0s
	}

	.load2 view:nth-child(1) {
		animation-delay: .13s
	}

	.load3 view:nth-child(1) {
		animation-delay: .26s
	}

	.load1 view:nth-child(2) {
		animation-delay: .39s
	}

	.load2 view:nth-child(2) {
		animation-delay: .52s
	}

	.load3 view:nth-child(2) {
		animation-delay: .65s
	}

	.load1 view:nth-child(3) {
		animation-delay: .78s
	}

	.load2 view:nth-child(3) {
		animation-delay: .91s
	}

	.load3 view:nth-child(3) {
		animation-delay: 1.04s
	}

	.load1 view:nth-child(4) {
		animation-delay: 1.17s
	}

	.load2 view:nth-child(4) {
		animation-delay: 1.3s
	}

	.load3 view:nth-child(4) {
		animation-delay: 1.43s
	}

	@-webkit-keyframes load {
		0% {
			opacity: 1
		}

		100% {
			opacity: .2
		}
	}

	@keyframes rotate {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style> 
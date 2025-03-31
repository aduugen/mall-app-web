<template>
	<view class="content">
		<view class="navbar">
			<view v-for="(item, index) in navList" :key="index" class="nav-item" :class="{current: tabCurrentIndex === index}"
			 @click="tabClick(index)">
				{{item.text}}
			</view>
		</view>
		
		<!-- 搜索框，仅在"已完成"选项卡时显示 -->
		<view class="search-box" v-if="tabCurrentIndex === 4">
			<view class="search-input-box">
				<text class="yticon icon-sousuo"></text>
				<input class="search-input" type="text" v-model="searchKeyword" placeholder="输入订单号或商品名称搜索" @input="searchOrders" />
				<text class="yticon icon-shanchu1" v-if="searchKeyword" @click="clearSearch"></text>
			</view>
		</view>

		<swiper :current="tabCurrentIndex" class="swiper-box" :class="{'with-search': tabCurrentIndex === 4}" duration="300" @change="changeTab">
			<swiper-item class="tab-content" v-for="(tabItem,tabIndex) in navList" :key="tabIndex">
				<scroll-view class="list-scroll-content" scroll-y @scrolltolower="loadData('add')">
					<!-- 空白页 -->
					<empty v-if="(tabCurrentIndex === 4 && searchKeyword ? filteredOrderList.length === 0 : orderList==null||orderList.length === 0)"></empty>

					<!-- 显示搜索结果提示 -->
					<view class="search-result-tip" v-if="tabCurrentIndex === 4 && searchKeyword && filteredOrderList.length >= 0">
						<text v-if="filteredOrderList.length > 0">找到 {{filteredOrderList.length}} 条相关订单</text>
						<text v-else>未找到相关订单</text>
					</view>

					<!-- 订单列表 - 搜索过滤逻辑 -->
					<view v-for="(item,index) in (tabCurrentIndex === 4 && searchKeyword ? filteredOrderList : orderList)" :key="index" class="order-item">
						<view class="i-top b-b">
							<text class="time" @click="showOrderDetail(item.id)">{{item.createTime | formatDateTime}}</text>
							<text class="state" :style="{color: '#286090'}">{{item.status | formatStatus}}</text>
							<text v-if="item.status===3||item.status===4" class="del-btn yticon icon-iconfontshanchu1" @click="deleteOrder(item.id)"></text>
						</view>
						<view class="order-no">
							<text class="order-no-text">订单编号：{{item.orderSn}}</text>
						</view>
						<view class="goods-box-single" v-for="(orderItem, itemIndex) in item.orderItemList"
						 :key="itemIndex">
							<image class="goods-img" :src="orderItem.productPic" mode="aspectFill"></image>
							<view class="right">
								<text class="title clamp">{{orderItem.productName}}</text>
								<text class="attr-box">{{orderItem.productAttr | formatProductAttr}} x {{orderItem.productQuantity}}</text>
								<text class="price">{{orderItem.productPrice}}</text>
							</view>
						</view>

						<view class="price-box">
							共
							<text class="num">{{calcTotalQuantity(item)}}</text>
							件商品 实付款
							<text class="price">{{item.payAmount}}</text>
						</view>
						<view class="action-box b-t" v-if="item.status == 0">
							<button class="action-btn" @click="cancelOrder(item.id)">取消订单</button>
							<button class="action-btn recom" @click="payOrder(item.id)">立即付款</button>
						</view>
						<view class="action-box b-t" v-if="item.status == 2">
							<button class="action-btn" >查看物流</button>
							<button class="action-btn recom" @click="receiveOrder(item.id)">确认收货</button>
						</view>
						<view class="action-box b-t" v-if="item.status == 3">
							<button class="action-btn" v-if="!isInvoiced(item.id)" @click="invoiceOrder(item)">开具发票</button>
							<button class="action-btn" @click="applyAfterSale(item)">申请售后</button>
							<button class="action-btn recom" @click="evaluateOrder(item)">评价商品</button>
							<button class="action-btn recom" >再次购买</button>
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
		fetchOrderList,
		cancelUserOrder,
		confirmReceiveOrder,
		deleteUserOrder
	} from '@/api/order.js';
	export default {
		components: {
			uniLoadMore,
			empty
		},
		data() {
			return {
				tabCurrentIndex: 0,
				orderParam: {
					status: -1,
					pageNum: 1,
					pageSize: 5
				},
				orderList: [],
				filteredOrderList: [], // 搜索过滤后的订单列表
				searchKeyword: '', // 搜索关键词
				loadingType:'more',
				navList: [{
						state: -1,
						text: '全部'
					},
					{
						state: 0,
						text: '待付款'
					},
					{
						state: 1,
						text: '待发货'
					},
					{
						state: 2,
						text: '待收货'
					},
					{
						state: 3,
						text: '已完成'
					}
				],
				invoicedOrderList: [],
			};
		},
		onLoad(options) {
			/**
			 * 修复app端点击除全部订单外的按钮进入时不加载数据的问题
			 * 替换onLoad下代码即可
			 */
			this.tabCurrentIndex = +options.state;
			// #ifndef MP
			this.loadData()
			// #endif
			// #ifdef MP
			if (options.state == 0) {
				this.loadData()
			}
			// #endif
			
			// 监听评价成功事件
			uni.$on('orderListRefresh', () => {
				this.loadData();
			});
			
			// 监听发票申请成功事件
			uni.$on('orderInvoiceApplied', (orderId) => {
				this.updateInvoiceStatus(orderId);
			});
		},
		onUnload() {
			// 页面卸载时移除事件监听
			uni.$off('orderListRefresh');
			uni.$off('orderInvoiceApplied');
		},
		onShow() {
			// 从本地缓存中读取已申请发票的订单ID列表
			this.invoicedOrderList = uni.getStorageSync('invoicedOrders') || [];
			console.log('订单列表页面 - 已申请发票订单列表:', this.invoicedOrderList);
			
			// 检查可能需要隐藏的开具发票按钮
			if (this.orderList && this.orderList.length > 0) {
				for (let i = 0; i < this.orderList.length; i++) {
					let orderId = parseInt(this.orderList[i].id);
					console.log(`检查订单${orderId}是否已申请发票:`, this.invoicedOrderList.includes(orderId));
				}
			}
		},
		filters: {
			formatStatus(status) {
				let statusTip = '';
				switch (+status) {
					case 0:
						statusTip = '等待付款';
						break;
					case 1:
						statusTip = '等待发货';
						break;
					case 2:
						statusTip = '等待收货';
						break;
					case 3:
						statusTip = '交易完成';
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
			//获取订单列表
			loadData(type='refresh') {
				if(type=='refresh'){
					this.orderParam.pageNum=1;
				}else{
					this.orderParam.pageNum++;
				}
				//这里是将订单挂载到tab列表下
				let index = this.tabCurrentIndex;
				let navItem = this.navList[index];
				let state = navItem.state;
				if (this.loadingType === 'loading') {
					//防止重复加载
					return;
				}
				this.orderParam.status = navItem.state;
				this.loadingType = 'loading';
				fetchOrderList(this.orderParam).then(response => {
					let list = response.data.list;
					if(type=='refresh'){
						this.orderList = list;
						this.loadingType = 'more';
					}else{
						if(list!=null&&list.length>0){
							this.orderList = this.orderList.concat(list);
							this.loadingType = 'more';
						}else{
							this.orderParam.pageNum--;
							this.loadingType = 'noMore';
						}
					}
					
					// 加载完数据后处理订单发票状态
					this.updateOrderInvoiceStatus();
				});
			},
			//swiper 切换
			changeTab(e) {
				this.tabCurrentIndex = e.target.current;
				this.searchKeyword = ''; // 切换选项卡时清空搜索框
				this.loadData();
			},
			//顶部tab点击
			tabClick(index) {
				this.tabCurrentIndex = index;
				this.searchKeyword = ''; // 切换选项卡时清空搜索框
			},
			//删除订单
			deleteOrder(orderId) {
				let superThis = this;
				uni.showModal({
				    title: '提示',
				    content: '是否要删除该订单？',
				    success: function (res) {
				        if (res.confirm) {
				            uni.showLoading({
				            	title: '请稍后'
				            })
				            deleteUserOrder({orderId:orderId}).then(response=>{
				            	uni.hideLoading();
				            	superThis.loadData();
				            });
				        } else if (res.cancel) {
				            console.log('用户点击取消');
				        }
				    }
				});
			},
			//取消订单
			cancelOrder(orderId) {
				let superThis = this;
				uni.showModal({
				    title: '提示',
				    content: '是否要取消该订单？',
				    success: function (res) {
				        if (res.confirm) {
				            uni.showLoading({
				            	title: '请稍后'
				            })
				            cancelUserOrder({orderId:orderId}).then(response=>{
				            	uni.hideLoading();
				            	superThis.loadData();
				            });
				        } else if (res.cancel) {
				            console.log('用户点击取消');
				        }
				    }
				});
			},
			//支付订单
			payOrder(orderId){
				uni.redirectTo({
					url: `/pages/money/pay?orderId=${orderId}`
				});
			},
			//确认收货
			receiveOrder(orderId){
				let superThis = this;
				uni.showModal({
				    title: '提示',
				    content: '是否要确认收货？',
				    success: function (res) {
				        if (res.confirm) {
				            uni.showLoading({
				            	title: '请稍后'
				            })
				            confirmReceiveOrder({orderId:orderId}).then(response=>{
				            	uni.hideLoading();
				            	superThis.loadData();
				            });
				        } else if (res.cancel) {
				            console.log('用户点击取消');
				        }
				    }
				});
			},
			//查看订单详情
			showOrderDetail(orderId){
				uni.navigateTo({
					url: `/pages/order/orderDetail?orderId=${orderId}`
				})
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
			/**
			 * 页面跳转
			 */
			navTo(url) {
				uni.navigateTo({
					url
				})
			},
			/**
			 * 显示评价页面
			 */
			evaluateOrder(order) {
				if(order.orderItemList && order.orderItemList.length > 0) {
					// if(order.orderItemList.length >= 1) {
						// 如果订单中有多个商品，跳转到批量评价页面
						this.navTo(`/pages/order/batchEvaluation?orderId=${order.id}`);
					// } else {
						// 如果只有一个商品，评价页面自动选中该商品进行评价
						// const orderItem = order.orderItemList[0];
						// this.navTo(`/pages/order/evaluation?orderId=${order.id}&productId=${orderItem.productId}`);
					    // this.navTo(`/pages/order/orderDetail?orderId=${order.id}`);
					// }
				} else {
					// 如果订单项为空，跳转到订单详情页
					this.navTo(`/pages/order/orderDetail?orderId=${order.id}`);
				}
			},
			//申请售后
			applyAfterSale(order) {
				uni.navigateTo({
					url: `/pages/afterSale/applyAfterSale?orderId=${order.id}`
				});
			},
			//开具发票
			invoiceOrder(order) {
				// 从本地缓存中获取已申请发票的订单列表
				const invoicedOrderList = uni.getStorageSync('invoicedOrders') || [];
				const orderId = parseInt(order.id);
				
				console.log('开具发票检查 - 订单ID:', orderId, '类型:', typeof orderId);
				console.log('已申请发票订单列表:', invoicedOrderList);
				console.log('是否包含该订单ID:', invoicedOrderList.includes(orderId));
				
				// 如果该订单已申请过发票，则提示用户
				if (invoicedOrderList.includes(orderId)) {
					uni.showModal({
						title: '温馨提示',
						content: '该订单发票申请已提交，请前往我的发票查看申请进展',
						confirmText: '查看发票',
						cancelText: '返回',
						success: (result) => {
							if (result.confirm) {
								// 跳转到我的发票页面
								uni.navigateTo({
									url: '/pages/order/invoice-list'
								});
							}
						}
					});
					return;
				}
				
				// 否则跳转到发票申请页面
				uni.navigateTo({
					url: `/pages/order/invoice?orderId=${orderId}`
				});
			},
			// 更新订单的发票状态
			updateInvoiceStatus(orderId) {
				if (!this.orderList || this.orderList.length === 0) return;
				
				// 确保orderId是数字类型
				orderId = parseInt(orderId);
				
				// 获取最新的已申请发票订单列表
				const invoicedOrderList = uni.getStorageSync('invoicedOrders') || [];
				
				// 如果当前订单列表中包含了刚申请过发票的订单，则更新UI
				for (let i = 0; i < this.orderList.length; i++) {
					if (parseInt(this.orderList[i].id) === orderId) {
						// 由于无法直接修改订单对象添加一个新属性，我们使用整个列表的重新赋值来触发视图更新
						const updatedOrderList = [...this.orderList];
						updatedOrderList[i] = { ...updatedOrderList[i], invoiceApplied: true };
						this.orderList = updatedOrderList;
						
						// 刷新已申请发票订单列表
						this.invoicedOrderList = invoicedOrderList;
						break;
					}
				}
			},
			// 更新订单的发票状态
			updateOrderInvoiceStatus() {
				if (!this.orderList || this.orderList.length === 0) return;
				
				// 获取最新的已申请发票订单列表
				const invoicedOrderList = uni.getStorageSync('invoicedOrders') || [];
				
				// 如果当前订单列表中包含了刚申请过发票的订单，则更新UI
				for (let i = 0; i < this.orderList.length; i++) {
					if (invoicedOrderList.includes(parseInt(this.orderList[i].id))) {
						// 由于无法直接修改订单对象添加一个新属性，我们使用整个列表的重新赋值来触发视图更新
						const updatedOrderList = [...this.orderList];
						updatedOrderList[i] = { ...updatedOrderList[i], invoiceApplied: true };
						this.orderList = updatedOrderList;
						
						// 刷新已申请发票订单列表
						this.invoicedOrderList = invoicedOrderList;
					}
				}
			},
			isInvoiced(orderId) {
				return this.invoicedOrderList.includes(parseInt(orderId));
			},
			// 搜索订单
			searchOrders() {
				if (this.tabCurrentIndex !== 4) return; // 只在已完成选项卡搜索
				
				if (!this.searchKeyword) {
					this.filteredOrderList = []; // 搜索词为空时清空过滤列表
					return;
				}
				
				const keyword = this.searchKeyword.toLowerCase();
				
				// 在原始订单列表中搜索
				this.filteredOrderList = this.orderList.filter(order => {
					// 搜索订单号
					if (order.orderSn && order.orderSn.toLowerCase().includes(keyword)) {
						return true;
					}
					
					// 搜索商品名称
					if (order.orderItemList && order.orderItemList.length > 0) {
						for (const item of order.orderItemList) {
							if (item.productName && item.productName.toLowerCase().includes(keyword)) {
								return true;
							}
						}
					}
					
					return false;
				});
			},
			
			// 清空搜索
			clearSearch() {
				this.searchKeyword = '';
				this.filteredOrderList = [];
			},
		},
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

	.uni-swiper-item {
		height: auto;
	}

	.order-item {
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
				color: #286090;
			}

			.del-btn {
				padding: 10upx 0 10upx 36upx;
				font-size: $font-lg;
				color: $font-color-light;
				position: relative;

				&:after {
					content: '';
					width: 0;
					height: 30upx;
					border-left: 1px solid $border-color-dark;
					position: absolute;
					left: 20upx;
					top: 50%;
					transform: translateY(-50%);
				}
			}
		}

		/* 多条商品 */
		.goods-box {
			height: 160upx;
			padding: 20upx 0;
			white-space: nowrap;

			.goods-item {
				width: 120upx;
				height: 120upx;
				display: inline-block;
				margin-right: 24upx;
			}

			.goods-img {
				display: block;
				width: 100%;
				height: 100%;
			}
		}

		/* 单条商品 */
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
					color: #f04c41;
					
					&:before {
						content: '￥';
						font-size: $font-sm;
						margin: 0 2upx 0 8upx;
					}
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
				color: #f04c41;
				
				&:before {
					content: '￥';
					font-size: $font-sm;
					margin: 0 2upx 0 8upx;
				}
			}
		}

		.action-box {
			display: flex;
			justify-content: flex-end;
			align-items: center;
			height: 100upx;
			position: relative;
			padding-right: 30upx;
		}

		.action-btn {
			width: 160upx;
			height: 60upx;
			margin: 0;
			margin-left: 24upx;
			padding: 0;
			text-align: center;
			line-height: 60upx;
			font-size: $font-sm + 2upx;
			color: $font-color-dark;
			background: #fff;
			border-radius: 100px;

			&:after {
				border-radius: 100px;
			}

			&.recom {
				background: #fff9f9;
				color: $base-color;

				&:after {
					border-color: #f7bcc8;
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

	.inner-list-logo {
		width: 60upx;
		max-height: 60upx;
		margin-right: 30upx;
	}

	/* 订单编号样式 */
	.order-no {
		padding-top: 0;
	}
	.order-no-text {
		font-size: 24upx;
		color: #999;
	}

	/* 搜索框样式 */
	.search-box {
		padding: 20rpx 30rpx;
		background-color: #fff;
		position: relative;
		z-index: 9;
		box-shadow: 0 1px 2px rgba(0, 0, 0, .05);
	}
	
	.search-input-box {
		height: 70rpx;
		background-color: #f5f5f5;
		border-radius: 35rpx;
		display: flex;
		align-items: center;
		padding: 0 30rpx;
	}
	
	.search-input {
		flex: 1;
		padding: 0 20rpx;
		font-size: 28rpx;
	}
	
	.yticon {
		color: #999;
		font-size: 30rpx;
	}
	
	.search-result-tip {
		padding: 20rpx 30rpx;
		font-size: 26rpx;
		color: #666;
		background-color: #f8f8f8;
	}
	
	/* 适配搜索框后的滑动区域高度 */
	.swiper-box {
		height: calc(100% - 40px);
	}
	.swiper-box.with-search {
		height: calc(100% - 40px - 110rpx);
	}
</style>

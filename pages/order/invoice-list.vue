<template>
	<view class="content">
		<view class="navbar">
			<view 
				v-for="(item, index) in navList" :key="index" 
				class="nav-item" 
				:class="{current: tabCurrentIndex === index}"
				@click="tabClick(index)"
			>
				{{item.text}}
			</view>
			<view class="refresh-btn" @click="refreshCurrentTab">
				<text class="iconfont icon-refresh">刷新</text>
			</view>
		</view>
		
		<swiper :current="tabCurrentIndex" class="swiper-box" duration="300" @change="changeTab">
			<swiper-item class="tab-content" v-for="(tabItem,tabIndex) in navList" :key="tabIndex">
				<scroll-view 
					class="list-scroll-content" 
					scroll-y
					@scrolltolower="onScrolltolower"
					refresher-enabled
					:refresher-triggered="tabItem.refreshing"
					@refresherrefresh="refreshData(tabIndex)"
					refresher-background="#f8f8f8"
					:id="`scroll-view-${tabIndex}`"
				>
					<!-- 显示调试信息 -->
					<view class="debug-info" v-if="tabItem.invoiceList.length === 0">
						<text>当前选项卡: {{tabIndex}}, 当前索引: {{tabCurrentIndex}}</text>
					</view>
					
					<!-- 空白页 -->
					<empty v-if="tabItem.invoiceList.length === 0 && tabItem.loadingType !== 'loading'"></empty>
					
					<!-- 加载中状态 -->
					<view class="loading-container" v-if="tabItem.invoiceList.length === 0 && tabItem.loadingType === 'loading'">
						<view class="loading-spinner"></view>
						<text class="loading-text">加载中...</text>
					</view>
					
					<!-- 发票列表 -->
					<view 
						v-for="(item, index) in tabItem.invoiceList" 
						:key="index"
						class="invoice-item"
					>
						<view class="i-top b-b">
							<text class="time">申请时间：{{formatDate(item.applyTime)}}</text>
							<text class="state" :style="{color: stateColor(item.status)}">{{stateName(item.status)}}</text>
							<text class="del-btn yticon icon-iconfontshanchu1" @click="deleteInvoice(index)" v-if="item.status === 2"></text>
						</view>
						<view class="i-content">
							<view class="i-info b-b">
								<view class="info-item">
									<text class="title">订单编号:</text>
									<text class="content">{{item.orderSn}}</text>
								</view>
								<view class="info-item">
									<text class="title">发票抬头:</text>
									<text class="content">{{item.invoiceTitle}}</text>
								</view>
								<view class="info-item" v-if="item.taxNumber">
									<text class="title">税号:</text>
									<text class="content">{{item.taxNumber}}</text>
								</view>
								<view class="info-item">
									<text class="title">发票金额:</text>
									<text class="content price">¥{{item.invoiceAmount}}</text>
								</view>
								<view class="info-item" v-if="item.invoiceType === 1">
									<text class="title">收票邮箱:</text>
									<text class="content">{{item.receiverEmail}}</text>
								</view>
							</view>
							<view class="i-action">
								<view class="action-btn" @click="viewOrderDetail(item.orderSn)">
									查看订单内容
								</view>
							</view>
						</view>
						
						<!-- 商品信息区域 -->
						<view class="goods-info" v-if="false">
							<view class="goods-title b-b">商品信息</view>
							<view class="goods-table">
								<view class="goods-table-header">
									<view class="col-name">商品名称</view>
									<view class="col-spec">规格</view>
									<view class="col-price">单价</view>
									<view class="col-quantity">数量</view>
									<view class="col-amount">金额</view>
								</view>
								<view class="goods-table-body">
									<view class="goods-table-row" v-for="(good, goodIndex) in item.items" :key="goodIndex">
										<view class="col-name">{{good.productName}}</view>
										<view class="col-spec">{{good.weight}}{{good.unit}}</view>
										<view class="col-price">¥{{good.price}}</view>
										<view class="col-quantity">{{good.quantity}}</view>
										<view class="col-amount">¥{{good.amount}}</view>
									</view>
								</view>
							</view>
							<view class="goods-total">
								<text class="total-label">合计：</text>
								<text class="total-amount">¥{{item.invoiceAmount}}</text>
							</view>
						</view>
					</view>
					
					<uni-load-more :status="tabItem.loadingType" v-if="tabItem.invoiceList.length > 0"></uni-load-more>
				</scroll-view>
			</swiper-item>
		</swiper>
	</view>
</template>

<script>
	import uniLoadMore from '@/components/uni-load-more/uni-load-more.vue';
	import empty from "@/components/empty";
	import { fetchInvoiceList, fetchInvoiceDetail } from '@/api/order.js';
	
	export default {
		components: {
			uniLoadMore,
			empty
		},
		data() {
			return {
				tabCurrentIndex: 0,
				navList: [
					{
						state: -1,
						text: '全部',
						loadingType: 'more',
						invoiceList: [],
						pageNum: 1,
						refreshing: false
					},
					{
						state: 0,
						text: '待开票',
						loadingType: 'more',
						invoiceList: [],
						pageNum: 1,
						refreshing: false
					},
					{
						state: 1,
						text: '已开票',
						loadingType: 'more',
						invoiceList: [],
						pageNum: 1,
						refreshing: false
					},
					{
						state: 2,
						text: '开票失败',
						loadingType: 'more',
						invoiceList: [],
						pageNum: 1,
						refreshing: false
					}
				],
				pageSize: 10,
				isLoadingMore: false,
				_loadDataTimer: null
			};
		},
		watch: {
			tabCurrentIndex(newVal, oldVal) {
				console.log(`标签页从 ${oldVal} 切换到 ${newVal}`);
			}
		},
		onLoad(options){
			// 获取发票列表
			this.loadData();
		},
		onShow() {
			// 每次显示页面时重新加载数据
			console.log('发票列表页面显示，重新加载数据');
			
			// 检查当前选项卡是否有数据，没有数据或数据少于5条才重新加载
			const currentTab = this.navList[this.tabCurrentIndex];
			if (!currentTab.invoiceList || currentTab.invoiceList.length < 5) {
				// 只清空当前选项卡的数据
				currentTab.invoiceList = [];
				currentTab.loadingType = 'more';
				currentTab.pageNum = 1;
				
				// 加载当前选项卡的数据
				this.loadData(true, true);
			}
		},
		onUnload() {
			// 页面销毁时清除定时器
			if(this._loadDataTimer) {
				clearTimeout(this._loadDataTimer);
				this._loadDataTimer = null;
			}
		},
		methods: {
			// 格式化时间
			formatDate(dateStr) {
				if (!dateStr) return '';
				const date = new Date(dateStr);
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				const hours = String(date.getHours()).padStart(2, '0');
				const minutes = String(date.getMinutes()).padStart(2, '0');
				const seconds = String(date.getSeconds()).padStart(2, '0');
				return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
			},
			
			// 获取状态名称
			stateName(status) {
				let name = '';
				switch (status) {
					case 0:
						name = '待开票';
						break;
					case 1:
						name = '已开票';
						break;
					case 2:
						name = '开票失败';
						break;
					default:
						name = '未知状态';
				}
				return name;
			},
			
			// 获取状态颜色
			stateColor(status) {
				let color = '';
				switch (status) {
					case 0:
						color = '#909399';
						break;
					case 1:
						color = '#67C23A';
						break;
					case 2:
						color = '#F56C6C';
						break;
					default:
						color = '#909399';
				}
				return color;
			},
			
			// 顶部选项卡点击事件
			tabClick(index){
				console.log('点击切换选项卡', index);
				
				// 如果是同一个选项卡，不处理
				if(this.tabCurrentIndex === index) {
					return;
				}
				
				// 切换选项卡
				this.tabCurrentIndex = index;
				
				// 如果当前选项卡没有数据，则加载数据
				if (this.navList[index].invoiceList.length === 0) {
					this.loadData(true);
				}
			},
			
			// 顶部选项卡滑动事件
			changeTab(e){
				console.log('滑动切换选项卡，事件对象:', e);
				
				// 在uni-app中，swiper的change事件返回的是e.detail.current
				const current = e.detail ? e.detail.current : e.target.current;
				console.log('当前切换到的索引:', current);
				
				// 如果是同一个选项卡，不处理
				if(this.tabCurrentIndex === current) {
					return;
				}
				
				// 更新当前索引
				this.tabCurrentIndex = current;
				
				// 如果当前选项卡没有数据，则加载数据
				if (this.navList[this.tabCurrentIndex].invoiceList.length === 0) {
					this.loadData(true);
				}
			},
			
			// 监听滚动事件，保存当前滚动位置
			onScroll(e) {
				const { scrollTop } = e.detail;
				const currentTab = this.navList[this.tabCurrentIndex];
				currentTab.scrollTop = scrollTop;
			},
			
			// 加载发票数据
			loadData(refresh = false, showLoading = false){
				// 清除之前的定时器
				if(this._loadDataTimer) {
					clearTimeout(this._loadDataTimer);
				}
				
				// 设置新的定时器，防止频繁触发
				this._loadDataTimer = setTimeout(() => {
					this._doLoadData(refresh, showLoading);
				}, 300);
			},
			
			// 实际执行数据加载的方法
			_doLoadData(refresh = false, showLoading = false) {
				// 获取当前选项卡的状态和数据集合
				const currentTab = this.navList[this.tabCurrentIndex];
				
				// 如果正在加载中，防止重复触发
				if(this.isLoadingMore && !refresh) {
					return;
				}
				
				// 如果是刷新则清空原有数据和重置页码
				if(refresh){
					currentTab.pageNum = 1;
					currentTab.invoiceList = [];
					currentTab.loadingType = 'loading'; // 立即显示加载状态
					currentTab.scrollTop = 0; // 重置滚动位置
				}
				
				// 如果已经是最后一页则不加载
				if(currentTab.loadingType === 'noMore'){
					uni.showToast({
						title: '没有更多数据了',
						icon: 'none',
						duration: 1500
					});
					return;
				}
				
				// 设置为加载中状态
				currentTab.loadingType = 'loading';
				this.isLoadingMore = true;
				
				// 如果需要显示loading或者是空列表第一次加载
				if(showLoading || currentTab.invoiceList.length === 0) {
					uni.showLoading({
						title: '加载中'
					});
				}
				
				// 调用数据获取方法
				this.fetchData(this.tabCurrentIndex).then(() => {
					// 隐藏loading
					uni.hideLoading();
					this.isLoadingMore = false;
				}).catch(() => {
					// 隐藏loading
					uni.hideLoading();
					this.isLoadingMore = false;
					
					uni.showToast({
						title: '获取发票列表失败',
						icon: 'none'
					});
				});
			},
			
			// 查看发票详情
			showInvoiceDetail(id){
				console.log('查看发票详情, ID:', id);
				if(!id) {
					uni.showToast({
						title: '发票ID不存在',
						icon: 'none'
					});
					return;
				}
				
				uni.navigateTo({
					url: `/pages/order/invoice-detail?id=${id}`
				});
			},
			
			// 查看订单内容
			viewOrderDetail(orderSn) {
				console.log('查看订单内容, 订单编号:', orderSn);
				if(!orderSn) {
					uni.showToast({
						title: '订单编号不存在',
						icon: 'none'
					});
					return;
				}
				
				// 显示loading提示
				uni.showLoading({
					title: '正在跳转...'
				});
				
				// 跳转到已完成订单页面并传递订单编号作为搜索关键词
				setTimeout(() => {
					uni.hideLoading();
					// 同时传递关键词和精确匹配参数
					uni.navigateTo({
						url: `/pages/order/order?state=4&keyword=${orderSn}&exactMatch=true`,
						success: () => {
							console.log('跳转成功');
						},
						fail: (err) => {
							console.error('跳转失败:', err);
							uni.showToast({
								title: '跳转失败，请重试',
								icon: 'none'
							});
						}
					});
				}, 300);
			},
			
			// 删除发票申请记录
			deleteInvoice(index){
				uni.showModal({
					title: '提示',
					content: '是否删除该发票申请记录？',
					success: res => {
						if(res.confirm){
							const item = this.navList[this.tabCurrentIndex].invoiceList[index];
							// 接口调用，这里仅做演示，后续需要对接真实接口
							uni.showLoading({
								title: '处理中'
							});
							
							setTimeout(() => {
								this.navList[this.tabCurrentIndex].invoiceList.splice(index, 1);
								uni.hideLoading();
								uni.showToast({
									title: '删除成功'
								});
							}, 600);
						}
					}
				});
			},
			
			// 刷新当前选项卡的数据
			refreshCurrentTab() {
				console.log('刷新当前选项卡', this.tabCurrentIndex);
				// 强制刷新当前选项卡
				this.loadData(true, true); // 传入true表示刷新模式和显示loading
			},
			
			// 滚动到底部事件处理
			onScrolltolower() {
				console.log('滚动到底部，加载更多数据');
				if (!this.isLoadingMore) {
					this.loadData();
				}
			},
			
			// 下拉刷新处理
			refreshData(tabIndex) {
				console.log('下拉刷新选项卡', tabIndex);
				
				// 设置刷新状态
				this.navList[tabIndex].refreshing = true;
				
				// 加载数据（刷新模式）
				const currentTab = this.navList[tabIndex];
				currentTab.pageNum = 1;
				currentTab.invoiceList = [];
				currentTab.loadingType = 'loading';
				
				// 请求数据
				this.fetchData(tabIndex).then(() => {
					// 完成刷新
					setTimeout(() => {
						this.navList[tabIndex].refreshing = false;
					}, 300);
					
					// 提示刷新成功
					uni.showToast({
						title: '刷新成功',
						icon: 'none',
						duration: 1000
					});
				}).catch(() => {
					// 完成刷新（即使有错误）
					setTimeout(() => {
						this.navList[tabIndex].refreshing = false;
					}, 300);
				});
			},
			
			// 提取数据获取逻辑为单独的方法，便于复用
			fetchData(tabIndex) {
				return new Promise((resolve, reject) => {
					const currentTab = this.navList[tabIndex];
					
					// 构建API参数
					const params = {
						pageNum: currentTab.pageNum,
						pageSize: this.pageSize
					};
					
					// 只有当状态不是全部时才添加状态过滤
					if(currentTab.state !== -1) {
						params.status = currentTab.state;
					}
					
					// 请求后台数据
					fetchInvoiceList(params).then(res => {
						if(res && res.code === 200) {
							// 获取正确的数据结构
							const data = res.data;
							
							// 检查数据结构是否符合预期
							if(data && data.list) {
								// 添加数据
								currentTab.invoiceList = currentTab.invoiceList.concat(data.list);
								
								// 当前页是否是最后一页
								if(data.list.length < this.pageSize) {
									currentTab.loadingType = 'noMore';
								} else {
									currentTab.loadingType = 'more';
									currentTab.pageNum++; // 增加当前选项卡的页码
								}
								resolve(data);
							} else {
								// 没有数据或数据结构不对
								currentTab.loadingType = 'noMore';
								resolve(null);
							}
						} else {
							currentTab.loadingType = 'more';
							reject(new Error('获取发票列表失败'));
						}
					}).catch(err => {
						console.error('获取发票列表错误:', err);
						currentTab.loadingType = 'more';
						reject(err);
					});
				});
			}
		}
	}
</script>

<style lang="scss">
	.content {
		background-color: #f8f8f8;
		min-height: 100vh;
	}
	
	.navbar {
		display: flex;
		height: 80rpx;
		padding: 0 5px;
		background: #fff;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.06);
		position: relative;
		z-index: 10;
		
		.nav-item {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;
			font-size: 28rpx;
			color: #303133;
			position: relative;
			
			&.current {
				color: #3366cc;
				
				&:after {
					content: '';
					position: absolute;
					left: 50%;
					bottom: 0;
					transform: translateX(-50%);
					width: 44rpx;
					height: 4rpx;
					background: linear-gradient(to right, #2255aa, #3366cc);
				}
			}
		}
		
		.refresh-btn {
			padding: 0 20rpx;
			font-size: 28rpx;
			color: #909399;
		}
	}
	
	.swiper-box {
		height: calc(100vh - 80rpx);
	}
	
	.list-scroll-content {
		height: 100%;
		padding-bottom: 100rpx;
	}
	
	.invoice-item {
		margin: 20rpx;
		background-color: #fff;
		border-radius: 15rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		overflow: hidden;
		
		.i-top {
			display: flex;
			align-items: center;
			font-size: 24rpx;
			color: #909399;
			padding: 20rpx 30rpx;
			background-color: #eef2fa;
			
			.time {
				flex: 1;
			}
			
			.state {
				margin-right: 20rpx;
			}
			
			.del-btn {
				padding: 10rpx;
				font-size: 34rpx;
				color: #C0C4CC;
			}
		}
		
		.i-content {
			background-color: #fff;
			
			.i-info {
				padding: 20rpx 30rpx;
				
				.info-item {
					margin-bottom: 20rpx;
					
					&:last-child {
						margin-bottom: 0;
					}
					
					.title {
						width: 160rpx;
						font-size: 26rpx;
						color: #909399;
					}
					
					.content {
						flex: 1;
						padding-left: 10rpx;
						font-size: 26rpx;
						color: #303133;
						word-break: break-all;
						
						&.price {
							color: #3366cc;
							font-weight: bold;
						}
					}
				}
			}
			
			.i-action {
				display: flex;
				justify-content: flex-end;
				align-items: center;
				padding: 20rpx 30rpx;
				
				.action-btn {
					height: 60rpx;
					padding: 0 30rpx;
					border: 1rpx solid #3366cc;
					border-radius: 30rpx;
					color: #3366cc;
					font-size: 26rpx;
					display: flex;
					align-items: center;
					
					&:after {
						content: '';
						display: block;
						width: 10rpx;
						height: 10rpx;
						margin-left: 10rpx;
						border-top: 2rpx solid #3366cc;
						border-right: 2rpx solid #3366cc;
						transform: rotate(45deg);
					}
				}
			}
		}
	}
	
	.b-b {
		border-bottom: 1rpx solid #f2f2f2;
	}
	
	.debug-info {
		padding: 10px;
		background-color: #fffbe5;
		color: #8f6500;
		font-size: 12px;
		margin-bottom: 10px;
		border-radius: 4px;
	}
	
	.goods-info {
		margin-top: 20rpx;
		padding: 20rpx;
		background-color: #fff;
		
		.goods-title {
			font-size: 28rpx;
			color: #303133;
			margin-bottom: 20rpx;
		}
		
		.goods-table {
			margin-bottom: 20rpx;
			
			.goods-table-header {
				display: flex;
				font-size: 26rpx;
				color: #909399;
				padding: 10rpx 0;
				
				.col-name {
					flex: 1;
				}
				
				.col-spec {
					flex: 1;
				}
				
				.col-price {
					flex: 1;
				}
				
				.col-quantity {
					flex: 1;
				}
				
				.col-amount {
					flex: 1;
				}
			}
			
			.goods-table-body {
				.goods-table-row {
					display: flex;
					font-size: 26rpx;
					color: #303133;
					padding: 10rpx 0;
					
					.col-name {
						flex: 1;
					}
					
					.col-spec {
						flex: 1;
					}
					
					.col-price {
						flex: 1;
					}
					
					.col-quantity {
						flex: 1;
					}
					
					.col-amount {
						flex: 1;
					}
				}
			}
		}
		
		.goods-total {
			display: flex;
			justify-content: flex-end;
			align-items: center;
			font-size: 28rpx;
			color: #303133;
			padding: 10rpx 0;
			
			.total-label {
				margin-right: 10rpx;
			}
			
			.total-amount {
				font-weight: 600;
			}
		}
	}
	
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 50rpx 0;
		
		.loading-spinner {
			width: 60rpx;
			height: 60rpx;
			border: 6rpx solid #f3f3f3;
			border-top: 6rpx solid #3366cc;
			border-radius: 50%;
			animation: spin 1s linear infinite;
			margin-bottom: 20rpx;
		}
		
		.loading-text {
			color: #909399;
			font-size: 28rpx;
		}
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	/* 确保加载更多组件在底部有足够间距 */
	.uni-load-more {
		margin: 30rpx 0 50rpx 0;
	}
</style> 
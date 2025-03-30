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
					@scrolltolower="loadData"
				>
					<!-- 显示调试信息 -->
					<view class="debug-info" v-if="tabItem.invoiceList.length === 0">
						<text>当前选项卡: {{tabIndex}}, 当前索引: {{tabCurrentIndex}}</text>
					</view>
					
					<!-- 空白页 -->
					<empty v-if="tabItem.invoiceList.length === 0"></empty>
					
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
									<text class="title">发票抬头:</text>
									<text class="content">{{item.invoiceTitle}}</text>
								</view>
								<view class="info-item" v-if="item.taxNumber">
									<text class="title">税号:</text>
									<text class="content">{{item.taxNumber}}</text>
								</view>
								<view class="info-item">
									<text class="title">发票内容:</text>
									<text class="content">{{item.invoiceContent}}</text>
								</view>
								<view class="info-item">
									<text class="title">发票金额:</text>
									<text class="content price">¥{{item.invoiceAmount}}</text>
								</view>
							</view>
							<view class="i-action">
								<view class="action-btn" @click="showInvoiceDetail(item.id)">
									查看详情
								</view>
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
						invoiceList: []
					},
					{
						state: 0,
						text: '待开票',
						loadingType: 'more',
						invoiceList: []
					},
					{
						state: 1,
						text: '已开票',
						loadingType: 'more',
						invoiceList: []
					},
					{
						state: 2,
						text: '开票失败',
						loadingType: 'more',
						invoiceList: []
					}
				],
				pageNum: 1,
				pageSize: 10
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
				this.pageNum = 1;
				
				// 加载当前选项卡的数据
				this.loadData(true, true);
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
				// 不重置页码和清空数据，除非是刷新操作
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
				
				// 更新当前索引
				this.tabCurrentIndex = current;
				
				// 如果当前选项卡没有数据，则加载数据
				if (this.navList[this.tabCurrentIndex].invoiceList.length === 0) {
					this.loadData(true);
				}
			},
			
			// 加载发票数据
			loadData(refresh = false, showLoading = false){
				// 获取当前选项卡的状态和数据集合
				const currentTab = this.navList[this.tabCurrentIndex];
				
				// 如果是刷新则清空原有数据和重置页码
				if(refresh){
					this.pageNum = 1;
					currentTab.invoiceList = [];
					currentTab.loadingType = 'more';
				}
				
				// 如果已经是最后一页则不加载
				if(currentTab.loadingType === 'noMore'){
					return;
				}
				
				// 设置为加载中状态
				currentTab.loadingType = 'loading';
				
				// 如果需要显示loading
				if(showLoading) {
					uni.showLoading({
						title: '加载中'
					});
				}
				
				// 构建API参数
				const params = {
					pageNum: this.pageNum,
					pageSize: this.pageSize
				};
				
				// 只有当状态不是全部时才添加状态过滤
				if(currentTab.state !== -1) {
					params.status = currentTab.state;
				}
				
				console.log('发送请求参数:', params, '当前选项卡索引:', this.tabCurrentIndex);
				
				// 使用setTimeout确保UI更新后再发送请求
				const that = this; // 保存this引用以便在setTimeout中使用
				setTimeout(() => {
					// 请求后台数据
					fetchInvoiceList(params).then(res => {
						// 如果显示了loading则隐藏
						if(showLoading) {
							uni.hideLoading();
						}
						
						console.log('获取发票列表响应:', res);
						// 注意：确保响应数据的处理正确
						if(res && res.code === 200){
							// 获取正确的数据结构
							const data = res.data;
							console.log('获取到的发票数据:', data);
							
							// 检查数据结构是否符合预期
							if(data && data.list) {
								// 添加数据
								currentTab.invoiceList = currentTab.invoiceList.concat(data.list);
								console.log(`当前选项卡(${that.tabCurrentIndex})数据长度:`, currentTab.invoiceList.length);
								
								// 当前页是否是最后一页
								if(data.list.length < that.pageSize){
									currentTab.loadingType = 'noMore';
								}else{
									currentTab.loadingType = 'more';
									that.pageNum++;
								}
							} else {
								// 没有数据或数据结构不对
								currentTab.loadingType = 'noMore';
								console.log('API返回的数据结构不符合预期:', data);
							}
						} else {
							currentTab.loadingType = 'more';
							uni.showToast({
								title: (res && res.message) || '获取发票列表失败',
								icon: 'none'
							});
						}
					})
					.catch(err => {
						console.error('获取发票列表错误:', err);
						currentTab.loadingType = 'more';
						uni.showToast({
							title: '获取发票列表失败',
							icon: 'none'
						});
					});
				}, 500);
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
				this.loadData(true, true); // 传入true表示显示loading
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
				color: #fa436a;
				
				&:after {
					content: '';
					position: absolute;
					left: 50%;
					bottom: 0;
					transform: translateX(-50%);
					width: 44rpx;
					height: 4rpx;
					background: linear-gradient(to right, #ff3456, #ff347d);
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
					display: flex;
					margin-bottom: 15rpx;
					
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
						font-size: 26rpx;
						color: #303133;
						
						&.price {
							color: #fa436a;
							font-weight: 600;
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
					border: 1rpx solid #fa436a;
					border-radius: 30rpx;
					color: #fa436a;
					font-size: 26rpx;
					display: flex;
					align-items: center;
					
					&:after {
						content: '';
						display: block;
						width: 10rpx;
						height: 10rpx;
						margin-left: 10rpx;
						border-top: 2rpx solid #fa436a;
						border-right: 2rpx solid #fa436a;
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
</style> 
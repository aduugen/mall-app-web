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
							<!-- 开具发票按钮，根据后端返回的invoiceStatus状态来判断 -->
							<button class="action-btn" v-if="item.invoiceStatus === 0 || item.invoiceStatus === 3" @click="invoiceOrder(item)">开具发票</button>
							
							<!-- 在"申请中"状态下显示查询按钮 -->
							<button class="action-btn" v-if="item.invoiceStatus === 1" @click="checkInvoiceStatus(item)">查询发票</button>
							
							<!-- 在"已开票"状态下显示查看按钮 -->
							<button class="action-btn" v-if="item.invoiceStatus === 2" @click="viewInvoice(item)">查看发票</button>
							
							<!-- 售后按钮逻辑 - 改进版 -->
							<button class="action-btn after-sale-btn" v-if="item.canApplyAfterSale" @click="applyAfterSale(item)">申请售后</button>
							<button class="action-btn after-sale-btn" v-if="item.hasAfterSaleRecords" @click="checkAfterSale(item)">查询售后</button>
							
							<button class="action-btn recom" @click="evaluateOrder(item)">评价商品</button>
							<button class="action-btn recom" >再次购买</button>
						</view>
					</view>

					<view class="loading-more">
						<view v-if="loadingType === 'loading'" class="loading-spinner"></view>
						<text class="loading-text">
							{{loadingType === 'more' ? '上拉加载更多' : 
							  (loadingType === 'loading' ? '正在加载...' : '没有更多数据了')}}
						</text>
					</view>

				</scroll-view>
			</swiper-item>
		</swiper>
	</view>
</template>

<script>
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
	import {
		checkOrderAfterSaleStatus
	} from '@/api/afterSale.js';
	import {
		fetchInvoiceByOrderId,
		checkOrderInvoice
	} from '@/api/invoice.js';
	export default {
		components: {
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
				]
			};
		},
		onLoad(options) {
			/**
			 * 修复app端点击除全部订单外的按钮进入时不加载数据的问题
			 * 替换onLoad下代码即可
			 */
			this.tabCurrentIndex = +options.state;
			
			// 处理搜索关键词参数，主要用于从发票列表页面跳转
			const hasKeyword = options.keyword && this.tabCurrentIndex === 4;
			
			// 先加载数据
			const loadPromise = new Promise((resolve) => {
				// #ifndef MP
				this.loadData().then(resolve).catch(resolve);
				// #endif
				// #ifdef MP
				if (options.state == 0) {
					this.loadData().then(resolve).catch(resolve);
				} else {
					resolve();
				}
				// #endif
			});
			
			// 如果有搜索关键词，需要等待数据加载完成后执行搜索
			if (hasKeyword) {
				this.searchKeyword = options.keyword;
				
				// 显示加载提示
				if (options.exactMatch === 'true') {
					uni.showLoading({
						title: '搜索订单中...'
					});
				}
				
				// 等待数据加载完成
				loadPromise.then(() => {
					// 延迟执行搜索，确保数据已渲染
					setTimeout(() => {
						// 如果需要精确匹配（主要用于订单号搜索）
						if (options.exactMatch === 'true') {
							this.searchOrderByOrderSn(options.keyword);
						} else {
							this.searchOrders();
						}
						uni.hideLoading();
					}, 500);
				});
			}
			
			// 监听评价成功事件以及售后申请成功的事件
			uni.$on('orderListRefresh', this.loadData);
		},
		destroyed() {
			// 移除事件监听，避免内存泄漏
			uni.$off('orderListRefresh', this.loadData);
		},
		onUnload() {
			// 页面卸载时移除事件监听
			uni.$off('orderListRefresh');
		},
		onShow() {
			// 页面显示时刷新数据
			if (this.orderList && this.orderList.length > 0) {
				console.log('订单列表页面显示，刷新数据');
				this.loadData();
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
					return Promise.reject(new Error('正在加载中'));
				}
				this.orderParam.status = navItem.state;
				this.loadingType = 'loading';
				
				return new Promise((resolve, reject) => {
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
						
						// 处理已完成订单的售后状态
						this.updateOrderAfterSaleStatus();
						
						resolve(this.orderList);
					}).catch(error => {
						this.loadingType = 'more';
						reject(error);
					});
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
				// 开始跳转前提示加载
				uni.showLoading({
					title: '准备中...'
				});
				
				// 先检查订单售后状态
				checkOrderAfterSaleStatus(order.id).then(response => {
					uni.hideLoading();
					
					if (response.code === 200) {
						const result = response.data;
						
						// 确认是否可申请售后
						if (!result.canApplyAfterSale) {
							uni.showToast({
								title: '该订单商品已全部申请售后',
								icon: 'none',
								duration: 2000
							});
							return;
						}
						
						// 如果有可申请的商品，则跳转到售后申请页面
						uni.navigateTo({
							url: `/pages/afterSale/applyAfterSale?orderId=${order.id}`
						});
					} else {
						uni.showToast({
							title: response.message || '检查订单状态失败',
							icon: 'none',
							duration: 2000
						});
					}
				}).catch(error => {
					uni.hideLoading();
					console.error('检查订单售后状态失败:', error);
					
					// 出错时也允许进入申请页面，由申请页面再次检查
					uni.navigateTo({
						url: `/pages/afterSale/applyAfterSale?orderId=${order.id}`
					});
				});
			},
			//开具发票
			invoiceOrder(order) {
				// 跳转到发票申请页面
				uni.navigateTo({
					url: `/pages/order/invoice?orderId=${order.id}`
				});
			},
			// 查询发票状态
			checkInvoiceStatus(order) {
				// 根据订单ID查询发票
				uni.showLoading({
					title: '查询中'
				});
				
				fetchInvoiceByOrderId(order.id).then(res => {
					uni.hideLoading();
					if (res.code === 200 && res.data) {
						// 有发票记录，跳转到发票详情页
						uni.navigateTo({
							url: `/pages/order/invoice-detail?id=${res.data.id}`
						});
					} else {
						uni.showToast({
							title: '未找到发票记录',
							icon: 'none'
						});
					}
				}).catch(err => {
					uni.hideLoading();
					uni.showToast({
						title: '查询发票状态失败',
						icon: 'none'
					});
				});
			},
			
			// 查看发票
			viewInvoice(order) {
				// 直接查询并跳转到发票详情
				uni.showLoading({
					title: '加载中'
				});
				
				fetchInvoiceByOrderId(order.id).then(res => {
					uni.hideLoading();
					if (res.code === 200 && res.data) {
						uni.navigateTo({
							url: `/pages/order/invoice-detail?id=${res.data.id}`
						});
					} else {
						uni.showToast({
							title: '未找到发票记录',
							icon: 'none'
						});
					}
				}).catch(err => {
					uni.hideLoading();
					uni.showToast({
						title: '获取发票详情失败',
						icon: 'none'
					});
				});
			},
			// 搜索订单
			searchOrders() {
				if (this.tabCurrentIndex !== 4) return; // 只在已完成选项卡搜索
				
				if (!this.searchKeyword) {
					this.filteredOrderList = []; // 搜索词为空时清空过滤列表
					return;
				}
				
				const keyword = this.searchKeyword.toLowerCase();
				
				// 检查是否是完整的订单号格式（通常订单号有特定格式）
				const isOrderSn = /^\d{10,}$/.test(keyword) || keyword.length > 10;
				
				if (isOrderSn) {
					// 对订单号执行精确匹配
					const exactMatch = this.orderList.find(order => 
						order.orderSn && order.orderSn.toLowerCase() === keyword
					);
					
					if (exactMatch) {
						this.filteredOrderList = [exactMatch];
						return;
					}
				}
				
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
			
			// 按订单编号专门搜索订单，处理分页情况
			searchOrderByOrderSn(orderSn) {
				if (this.tabCurrentIndex !== 4) return; // 只在已完成选项卡搜索
				
				// 先在当前列表精确搜索
				const exactMatch = this.orderList.find(order => order.orderSn === orderSn);
				
				if (exactMatch) {
					// 如果在当前列表找到了精确匹配的订单，只显示它
					this.filteredOrderList = [exactMatch];
					return;
				}
				
				// 否则发起API请求，直接搜索订单号
				uni.showLoading({
					title: '搜索中...'
				});
				
				// 构建专门搜索订单的请求参数
				const searchParams = {
					keyword: orderSn, // 使用关键词参数，而不是orderSn参数(后端API可能不支持)
					status: 3, // 已完成订单状态
					pageNum: 1,
					pageSize: 20 // 增大页面大小，提高找到结果的概率
				};
				
				// 调用API搜索指定订单号
				fetchOrderList(searchParams).then(response => {
					uni.hideLoading();
					
					if (response && response.data && response.data.list) {
						// 在返回结果中精确查找订单号匹配的订单
						const matchedOrders = response.data.list.filter(order => 
							order.orderSn === orderSn
						);
						
						if (matchedOrders.length > 0) {
							// 如果找到了精确匹配的订单，只显示它们
							this.filteredOrderList = matchedOrders;
						} else {
							// 如果没有精确匹配，但有关键词匹配的结果，显示全部结果
							this.filteredOrderList = response.data.list;
							
							if (this.filteredOrderList.length === 0) {
								uni.showToast({
									title: '未找到对应订单',
									icon: 'none'
								});
							} else {
								uni.showToast({
									title: '未找到精确匹配，显示相关订单',
									icon: 'none'
								});
							}
						}
					} else {
						uni.showToast({
							title: '搜索失败',
							icon: 'none'
						});
					}
				}).catch(err => {
					uni.hideLoading();
					console.error('搜索订单失败:', err);
					uni.showToast({
						title: '搜索失败，请重试',
						icon: 'none'
					});
				});
			},
			
			// 清空搜索
			clearSearch() {
				this.searchKeyword = '';
				this.filteredOrderList = [];
			},
			// 查询售后状态
			checkAfterSale(order) {
				// 查询订单的售后状态并跳转到售后列表页面
				uni.showLoading({
					title: '查询中'
				});
				
				checkOrderAfterSaleStatus(order.id).then(response => {
					uni.hideLoading();
					
					if (response.code === 200) {
						// 跳转到售后列表页面 - 默认显示全部标签
						const state = -1;
						uni.navigateTo({
							url: `/pages/afterSale/afterSaleList?state=${state}&orderId=${order.id}`
						});
					} else {
						uni.showToast({
							title: response.message || '查询售后状态失败',
							icon: 'none',
							duration: 2000
						});
					}
				}).catch(error => {
					uni.hideLoading();
					console.error('查询售后状态失败:', error);
					uni.showToast({
						title: '查询售后状态失败',
						icon: 'none',
						duration: 2000
					});
				});
			},
			// 更新订单发票状态
			updateOrderInvoiceStatus() {
				// 只处理已完成的订单
				const completedOrders = this.orderList.filter(order => order.status === 3);
				if (completedOrders.length === 0) return;
				
				// 对每个订单检查发票状态
				Promise.all(completedOrders.map(order => {
					// 如果已有发票状态且不是未申请或申请失败，则跳过
					if (order.invoiceStatus !== undefined && 
						order.invoiceStatus !== 0 && 
						order.invoiceStatus !== 3) {
						return Promise.resolve();
					}
					
					// 查询发票状态
					return checkOrderInvoice(order.id)
						.then(response => {
							if (response.code === 200 && response.data !== null) {
								// 更新订单的发票状态
								this.$set(order, 'invoiceStatus', response.data.invoiceStatus || 0);
							}
						})
						.catch(error => {
							console.error('获取订单发票状态失败:', error);
						});
				})).then(() => {
					console.log('所有订单发票状态已更新');
				}).catch(error => {
					console.error('更新发票状态过程出错:', error);
				});
			},
			// 更新订单售后状态
			updateOrderAfterSaleStatus() {
				// 只处理已完成的订单
				const completedOrders = this.orderList.filter(order => order.status === 3);
				if (completedOrders.length === 0) return;
				
				// 对每个订单检查售后状态
				Promise.all(completedOrders.map(order => {
					// 如果已经检查过售后状态，无需重复检查
					if (order.afterSaleStatusChecked === true) {
						return Promise.resolve();
					}
					
					// 查询售后状态
					return checkOrderAfterSaleStatus(order.id)
						.then(response => {
							if (response.code === 200 && response.data) {
								const afterSaleData = response.data;
								
								// 更新订单的售后状态基本信息
								this.$set(order, 'afterSaleStatus', afterSaleData.afterSaleStatus || 0);
								
								// 检查是否可以申请售后
								const canApply = afterSaleData.canApplyAfterSale === true;
								this.$set(order, 'canApplyAfterSale', canApply);
								
								// 检查是否有售后记录
								const hasRecords = afterSaleData.isApplied === true;
								this.$set(order, 'hasAfterSaleRecords', hasRecords);
								
								// 保存售后商品详情信息
								this.$set(order, 'afterSaleItems', afterSaleData.items || []);
								
								// 标记为已检查
								this.$set(order, 'afterSaleStatusChecked', true);
								
								console.log(`订单 ${order.id} 售后状态更新：状态=${afterSaleData.afterSaleStatus}, 可申请=${canApply}, 有记录=${hasRecords}`);
							}
						})
						.catch(error => {
							console.error('获取订单售后状态失败:', error);
							// 出错时设置默认值
							this.$set(order, 'canApplyAfterSale', true);
							this.$set(order, 'hasAfterSaleRecords', false);
						});
				})).then(() => {
					console.log('所有订单售后状态已更新');
				}).catch(error => {
					console.error('更新售后状态过程出错:', error);
				});
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
			flex-wrap: wrap; /* 允许按钮换行 */
			min-height: 100upx;
			position: relative;
			padding-right: 30upx;
			padding-bottom: 10upx; /* 底部添加内边距，避免按钮过于贴近底部 */
		}

		.action-btn {
			width: 160upx;
			height: 60upx;
			margin: 0;
			margin-left: 16upx; /* 减小按钮之间的间距 */
			margin-bottom: 10upx; /* 按钮底部加间距，适应换行情况 */
			padding: 0;
			text-align: center;
			line-height: 60upx;
			font-size: 24upx; /* 稍微减小字体，保证文字能完整显示 */
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
			
			/* 售后按钮专用样式 */
			&.after-sale-btn {
				width: 150upx; /* 售后按钮宽度稍窄 */
				background-color: #f0f9ff; /* 使用蓝色色调区分 */
				color: #3366cc;
				&:after {
					border-color: #a8ccee;
				}
			}
		}
	}


	/* load-more */
	.loading-more {
		display: flex;
		flex-direction: row;
		height: 80upx;
		align-items: center;
		justify-content: center;
	}

	.loading-text {
		font-size: 28upx;
		color: $font-color-light;
	}

	.loading-spinner {
		width: 36rpx;
		height: 36rpx;
		margin-right: 20rpx;
		border: 3rpx solid #f3f3f3;
		border-top: 3rpx solid $base-color;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
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

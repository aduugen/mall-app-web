<template>
	<view class="uni-load-more">
		<view class="uni-load-more__spinner" v-show="status === 'loading' && showIcon">
		</view>
		<text class="uni-load-more__text" :style="{color:color}">{{status === 'more' ? contentText.contentdown : (status === 'loading' ? contentText.contentrefresh : contentText.contentnomore)}}</text>
	</view>
</template>

<script>
	export default {
		name: "uni-load-more",
		props: {
			status: {
				//上拉的状态：more-loading前；loading-loading中；noMore-没有更多了
				type: String,
				default: 'more'
			},
			showIcon: {
				type: Boolean,
				default: true
			},
			color: {
				type: String,
				default: "#777777"
			},
			contentText: {
				type: Object,
				default () {
					return {
						contentdown: "上拉加载更多",
						contentrefresh: "正在加载中...",
						contentnomore: "没有更多数据了"
					};
				}
			}
		},
		data() {
			return {}
		}
	}
</script>

<style>
	@charset "UTF-8";

	.uni-load-more {
		display: flex;
		flex-direction: row;
		height: 80upx;
		align-items: center;
		justify-content: center;
	}

	.uni-load-more__text {
		font-size: 28upx;
		color: #999;
		margin-left: 8upx;
	}

	.uni-load-more__spinner {
		width: 36upx;
		height: 36upx;
		margin-right: 12upx;
		border-radius: 50%;
		border: 3upx solid #f3f3f3;
		border-top: 3upx solid #007AFF;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>
import type { Metadata } from 'next';
import ApiTester from '@/components/api-tester';

export const metadata: Metadata = {
  title: 'API Tester - 接口测试工具',
  description: '轻量级 API 接口测试工具，支持多种 HTTP 方法，请求历史记录，响应格式化',
};

export default function Home() {
  return <ApiTester />;
}

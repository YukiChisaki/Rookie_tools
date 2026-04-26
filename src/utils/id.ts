import { createId } from '@paralleldrive/cuid2';

/**
 * 生成唯一标识符
 * 使用 cuid2 替代原生 crypto.randomUUID()，提供更安全、更短的唯一 ID
 * @author Chisaki (ID: 68142319)
 * @since 2026-04-26 13:55:00
 * @returns 唯一标识符字符串
 */
export function generateId(): string {
  return createId();
}

"use client";

import { ReactNode } from "react";
import { Heading, Text, Flex } from "@radix-ui/themes";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <Flex justify="between" align="start" className="mb-4">
        <div>
          <Heading size="8" className="text-gray-900 mb-2 font-bold">
            {title}
          </Heading>
          {description && (
            <Text size="4" className="text-gray-600">
              {description}
            </Text>
          )}
        </div>
        {children && (
          <div className="flex gap-3">
            {children}
          </div>
        )}
      </Flex>
    </div>
  );
}
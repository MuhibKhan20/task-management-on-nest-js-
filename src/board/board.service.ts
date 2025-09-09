import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TBoard } from './types/board.type';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string): Promise<TBoard[]> | never {
    const board = await this.prisma.board.findMany({
      where: {
        workspaceId,
      },
      include: {
        lists: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Board has not found');
    }

    return board;
  }

  async findOne(id: string): Promise<TBoard> | never {
    const board = await this.prisma.board.findUnique({
      where: {
        id,
      },
      include: { lists: true },
    });

    if (!board) {
      throw new NotFoundException('Board has not found');
    }

    return board;
  }

  async getBoardStatistics(id: string): Promise<any> | never {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        lists: {
          include: {
            cards: true,
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board has not found');
    }

    // Calculate statistics
    const allCards = board.lists.flatMap(list => list.cards);
    const totalTasks = allCards.length;
    const completedTasks = allCards.filter(card => card.status === 'DONE').length;
    const pendingTasks = allCards.filter(card => card.status === 'TODO').length;
    
    // Calculate overdue tasks
    const now = new Date();
    const overdueTasks = allCards.filter(card => 
      card.deadline && 
      new Date(card.deadline) < now && 
      card.status !== 'DONE'
    ).length;

    // Priority breakdown
    const highPriority = allCards.filter(card => card.priority === 'HIGH' && card.status !== 'DONE').length;
    const mediumPriority = allCards.filter(card => card.priority === 'MEDIUM' && card.status !== 'DONE').length;
    const lowPriority = allCards.filter(card => card.priority === 'LOW' && card.status !== 'DONE').length;

    return {
      boardId: id,
      boardTitle: board.title,
      boardColor: board.color,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      priorityBreakdown: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority,
      },
      listsCount: board.lists.length,
    };
  }

  async create(
    workspaceId: string,
    createBoardDto: CreateBoardDto,
  ): Promise<TBoard> {
    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const board = await this.prisma.board.create({
      data: {
        title: createBoardDto.title,
        color: createBoardDto.color,
        workspace: { connect: { id: workspaceId } },
      },
    });

    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto): Promise<TBoard> {
    const board = await this.prisma.board.update({
      where: {
        id,
      },
      data: {
        title: updateBoardDto.title,
        color: updateBoardDto.color,
      },
    });

    return board;
  }

  async delete(id: string): Promise<{ message: string; statusCode: string }> {
    try {
      const board: TBoard = await this.prisma.board.delete({
        where: { id },
      });

      return {
        message: `${board.title} has been deleted`,
        statusCode: '200',
      };
    } catch (error) {
      return {
        message: error,
        statusCode: '404',
      };
    }
  }
}

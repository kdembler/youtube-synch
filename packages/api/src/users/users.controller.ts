import { IYoutubeClient, UsersRepository } from '@joystream/ytube'
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common'
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserDto, VerifyChannelRequest, VerifyChannelResponse } from '../dtos'

@Controller('users')
@ApiTags('channels')
export class UsersController {
  constructor(@Inject('youtube') private youtube: IYoutubeClient, private usersRepository: UsersRepository) {}

  @ApiOperation({
    description: `fetches user's channel from the supplied google authorization code, and verifies if it satisfies YPP induction criteria`,
  })
  @ApiBody({ type: VerifyChannelRequest })
  @ApiResponse({ type: VerifyChannelResponse })
  @Post()
  async verifyUserAndChannel(@Body() { authorizationCode }: VerifyChannelRequest): Promise<VerifyChannelResponse> {
    try {
      // get user from  authorization code
      const user = await this.youtube.getUserFromCode(authorizationCode)

      // TODO: ensure that is only be one channel for one user
      // get channel from user
      const [channel] = await this.youtube.getChannels(user)

      // verify channel
      await this.youtube.verifyChannel(channel)

      // save user
      await this.usersRepository.save(user)

      // return verified user
      return { email: user.email, userId: user.id }
    } catch (error) {
      const message = error instanceof Error ? error.message : error
      throw new BadRequestException(message)
    }
  }

  @ApiOperation({ description: 'Retrieves authenticated user by id' })
  @ApiResponse({ type: UserDto })
  @Get(':id')
  async get(@Param('id') id: string): Promise<UserDto> {
    try {
      // Get user with given id
      const result = await this.usersRepository.get(id)

      // prepare & return user response
      return new UserDto(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : error
      throw new NotFoundException(message)
    }
  }

  @Get()
  @ApiQuery({ type: String, required: false, name: 'search' })
  @ApiOperation({
    description: `Searches users added to the system. Use optional 'search' param to filter the results by email.`,
  })
  @ApiResponse({ type: UserDto, isArray: true })
  async find(@Query('search') search: string): Promise<UserDto[]> {
    try {
      // find users with given email
      const users = await this.usersRepository.scan('id', (q) =>
        search ? q.and().attribute('email').contains(search) : q
      )

      // prepare response
      const result = users.map((user) => new UserDto(user))

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : error
      throw new NotFoundException(message)
    }
  }
}
